import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createViemHandleClient } from '@iexec-nox/handle';
import { network } from 'hardhat';
import { keccak256, stringToHex } from 'viem';

const noxIt = process.env.NOX_E2E === '1' ? it : it.skip;

describe('nox-e2e official local stack', async () => {
  noxIt('funds and executes a real confidential payroll handle', async () => {
    const { viem } = await network.create();
    const publicClient = await viem.getPublicClient();
    const [treasury, employee, relayer] = await viem.getWalletClients();
    const token = await viem.deployContract('TestConfidentialUSDC');
    const payroll = await viem.deployContract('ConfidentialPayroll', [20n]);
    await token.write.faucet([treasury.account.address, 10_000_000n]);
    const handleClient = await createViemHandleClient(relayer);
    const encrypted = await handleClient.encryptInput(
      1_000_000n,
      'uint256',
      payroll.address,
    );
    const payrollId = keccak256(stringToHex('real-nox-payroll'));
    const block = await publicClient.getBlock();
    const deadline = Number(block.timestamp + 3600n);
    const manifest = await payroll.read.computeManifestHash([
      token.address,
      treasury.account.address,
      payrollId,
      [employee.account.address],
      [encrypted.handle],
      deadline,
    ]);
    await token.write.setOperator([payroll.address, deadline], {
      account: treasury.account,
    });
    await payroll.write.approvePayroll(
      [payrollId, manifest, token.address, 1, deadline],
      { account: treasury.account },
    );
    await payroll.write.executePayroll(
      [
        treasury.account.address,
        payrollId,
        token.address,
        [employee.account.address],
        [encrypted.handle],
        [encrypted.handleProof],
        deadline,
      ],
      { account: relayer.account },
    );
    const approval = await payroll.read.getApproval([
      treasury.account.address,
      payrollId,
    ]);
    assert.equal(approval.status, 3);
    assert.notEqual(
      await token.read.confidentialBalanceOf([employee.account.address]),
      `0x${'00'.repeat(32)}`,
    );
  });
});
