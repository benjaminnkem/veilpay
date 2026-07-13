import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { network } from 'hardhat';
import {
  keccak256,
  stringToHex,
  zeroAddress,
  type Address,
  type Hex,
} from 'viem';

describe('ConfidentialPayroll', async () => {
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();
  const wallets = await viem.getWalletClients();
  const [deployer, treasury, recipientA, recipientB, relayer, stranger] =
    wallets;
  let payroll: Awaited<ReturnType<typeof viem.deployContract>>;
  let token: Awaited<ReturnType<typeof viem.deployContract>>;
  const payrollId = keccak256(stringToHex('payroll-1'));
  const handles = [
    keccak256(stringToHex('salary-a')),
    keccak256(stringToHex('salary-b')),
  ] as Hex[];
  const recipients = [
    recipientA.account.address,
    recipientB.account.address,
  ] as Address[];

  beforeEach(async () => {
    payroll = await viem.deployContract('ConfidentialPayroll', [20n]);
    token = await viem.deployContract('MockERC7984');
  });

  async function approve(overrides?: {
    recipients?: Address[];
    handles?: Hex[];
    deadline?: number;
  }) {
    const block = await publicClient.getBlock();
    const chosenRecipients = overrides?.recipients ?? recipients;
    const chosenHandles = overrides?.handles ?? handles;
    const deadline = overrides?.deadline ?? Number(block.timestamp + 3600n);
    const manifest = await payroll.read.computeManifestHash([
      token.address,
      treasury.account.address,
      payrollId,
      chosenRecipients,
      chosenHandles,
      deadline,
    ]);
    await payroll.write.approvePayroll(
      [payrollId, manifest, token.address, chosenRecipients.length, deadline],
      { account: treasury.account },
    );
    return { manifest, deadline, chosenRecipients, chosenHandles };
  }

  async function fundAndAuthorize(deadline: number) {
    await token.write.setTestBalance([treasury.account.address, 10_000n]);
    await token.write.registerTestHandle([handles[0], 1000n]);
    await token.write.registerTestHandle([handles[1], 2000n]);
    await token.write.setOperatorForTest([
      treasury.account.address,
      payroll.address,
      deadline,
    ]);
  }

  it('executes an exact approved manifest permissionlessly and prevents replay', async () => {
    const approved = await approve();
    await fundAndAuthorize(approved.deadline);
    await payroll.write.executePayroll(
      [
        treasury.account.address,
        payrollId,
        token.address,
        recipients,
        handles,
        ['0x', '0x'],
        approved.deadline,
      ],
      { account: relayer.account },
    );
    assert.equal(
      await token.read.clearBalanceForTest([recipientA.account.address]),
      1000n,
    );
    assert.equal(
      await token.read.clearBalanceForTest([recipientB.account.address]),
      2000n,
    );
    const stored = await payroll.read.getApproval([
      treasury.account.address,
      payrollId,
    ]);
    assert.equal(stored.status, 3);
    await assert.rejects(() =>
      payroll.write.executePayroll(
        [
          treasury.account.address,
          payrollId,
          token.address,
          recipients,
          handles,
          ['0x', '0x'],
          approved.deadline,
        ],
        { account: stranger.account },
      ),
    );
  });

  it('rejects unknown, changed-recipient, changed-handle, wrong-token and malformed payloads', async () => {
    const block = await publicClient.getBlock();
    await assert.rejects(() =>
      payroll.write.executePayroll(
        [
          treasury.account.address,
          payrollId,
          token.address,
          recipients,
          handles,
          ['0x', '0x'],
          Number(block.timestamp + 100n),
        ],
        { account: relayer.account },
      ),
    );
    const approved = await approve();
    await fundAndAuthorize(approved.deadline);
    await assert.rejects(() =>
      payroll.write.executePayroll(
        [
          treasury.account.address,
          payrollId,
          token.address,
          [recipientA.account.address, stranger.account.address],
          handles,
          ['0x', '0x'],
          approved.deadline,
        ],
        { account: relayer.account },
      ),
    );
    await assert.rejects(() =>
      payroll.write.executePayroll(
        [
          treasury.account.address,
          payrollId,
          token.address,
          recipients,
          [handles[0], keccak256(stringToHex('changed'))],
          ['0x', '0x'],
          approved.deadline,
        ],
        { account: relayer.account },
      ),
    );
    await assert.rejects(() =>
      payroll.write.executePayroll(
        [
          treasury.account.address,
          payrollId,
          stranger.account.address,
          recipients,
          handles,
          ['0x', '0x'],
          approved.deadline,
        ],
        { account: relayer.account },
      ),
    );
    await assert.rejects(() =>
      payroll.write.executePayroll(
        [
          treasury.account.address,
          payrollId,
          token.address,
          recipients,
          handles,
          ['0x'],
          approved.deadline,
        ],
        { account: relayer.account },
      ),
    );
  });

  it('enforces treasury-scoped cancellation and duplicate-recipient policy', async () => {
    const approved = await approve();
    await assert.rejects(() =>
      payroll.write.cancelPayroll([payrollId], { account: stranger.account }),
    );
    await payroll.write.cancelPayroll([payrollId], {
      account: treasury.account,
    });
    await fundAndAuthorize(approved.deadline);
    await assert.rejects(() =>
      payroll.write.executePayroll(
        [
          treasury.account.address,
          payrollId,
          token.address,
          recipients,
          handles,
          ['0x', '0x'],
          approved.deadline,
        ],
        { account: relayer.account },
      ),
    );

    const duplicateId = keccak256(stringToHex('duplicate'));
    const duplicateRecipients = [
      recipientA.account.address,
      recipientA.account.address,
    ];
    const block = await publicClient.getBlock();
    const deadline = Number(block.timestamp + 3600n);
    const manifest = await payroll.read.computeManifestHash([
      token.address,
      treasury.account.address,
      duplicateId,
      duplicateRecipients,
      handles,
      deadline,
    ]);
    await payroll.write.approvePayroll(
      [duplicateId, manifest, token.address, 2, deadline],
      { account: treasury.account },
    );
    await assert.rejects(() =>
      payroll.write.executePayroll(
        [
          treasury.account.address,
          duplicateId,
          token.address,
          duplicateRecipients,
          handles,
          ['0x', '0x'],
          deadline,
        ],
        { account: relayer.account },
      ),
    );
  });

  it('rejects empty/oversized approvals and missing operator permission', async () => {
    const block = await publicClient.getBlock();
    await assert.rejects(() =>
      payroll.write.approvePayroll(
        [payrollId, handles[0], zeroAddress, 1, Number(block.timestamp + 10n)],
        { account: treasury.account },
      ),
    );
    await assert.rejects(() =>
      payroll.write.approvePayroll(
        [
          payrollId,
          handles[0],
          token.address,
          0,
          Number(block.timestamp + 10n),
        ],
        { account: treasury.account },
      ),
    );
    await assert.rejects(() =>
      payroll.write.approvePayroll(
        [
          payrollId,
          handles[0],
          token.address,
          21,
          Number(block.timestamp + 10n),
        ],
        { account: treasury.account },
      ),
    );
    const approved = await approve();
    await token.write.setTestBalance([treasury.account.address, 10_000n]);
    await assert.rejects(() =>
      payroll.write.executePayroll(
        [
          treasury.account.address,
          payrollId,
          token.address,
          recipients,
          handles,
          ['0x', '0x'],
          approved.deadline,
        ],
        { account: relayer.account },
      ),
    );
  });

  it('matches the backend canonical manifest vector', async () => {
    const harness = await viem.deployContract('ManifestHarness');
    const hash = await harness.read.compute([
      11155111n,
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
      '0x3333333333333333333333333333333333333333',
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      [
        '0x4444444444444444444444444444444444444444',
        '0x5555555555555555555555555555555555555555',
      ],
      [
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      ],
      2000000000,
    ]);
    assert.equal(
      hash,
      '0x0f914af5948c691e99b65b2fc6ca1deb508b751fa69a923cee83706717d60e54',
    );
  });
});
