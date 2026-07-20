import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createViemHandleClient } from '@iexec-nox/handle';
import SafeApiKit from '@safe-global/api-kit';
import Safe from '@safe-global/protocol-kit';
import {
  OperationType,
  type MetaTransactionData,
  type SafeTransaction,
} from '@safe-global/types-kit';
import type {
  ExecutePayrollPaymentRequest,
  ExecutePayrollPaymentResult,
  PayrollPaymentItem,
} from '@repo/types';
import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  formatUnits,
  http,
  isAddress,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import type { PaymentProvider } from './payment-provider.interface';
import { centsToUsdcBaseUnits, resolveNetworkConfig } from './network.config';
import { ERC20_ABI, ERC7984_ABI } from './erc7984.abi';

const MAX_NOX_TRANSFERS = 40;
const ZERO_HANDLE =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

type SafeKit = Awaited<ReturnType<typeof Safe.init>>;

/**
 * Hybrid Nox rail:
 * 1) Safe multi-send: approve + wrap(USDC → cToken minted to owner EOA)
 * 2) Owner EOA: encrypt + confidentialTransfer to each employee
 *
 * Why not Safe confidentialTransfer? Nox input proofs / ERC-7984 external
 * amounts are awkward under Safe multi-send and surface as opaque GS013.
 * USDC still leaves the Safe; confidential pays are signed by the owner EOA.
 */
@Injectable()
export class NoxPaymentProvider implements PaymentProvider {
  readonly kind = 'nox' as const;
  private readonly logger = new Logger(NoxPaymentProvider.name);

  constructor(private readonly config: ConfigService) {}

  async executePayroll(
    request: ExecutePayrollPaymentRequest,
  ): Promise<ExecutePayrollPaymentResult> {
    const ownerKey =
      this.config.get<string>('blockchain.noxPayerPrivateKey') ||
      this.config.get<string>('blockchain.safeOwnerPrivateKey');
    const rpcOverride = this.config.get<string>('blockchain.rpcUrl');
    const apiKey = this.config.get<string>('blockchain.safeApiKey');
    const cTokenAddress = (
      request.confidentialTokenAddress ||
      this.config.get<string>('blockchain.noxCtokenAddress') ||
      ''
    ).trim();

    if (!ownerKey) {
      throw new ServiceUnavailableException(
        'SAFE_OWNER_PRIVATE_KEY (or NOX_PAYER_PRIVATE_KEY) must be set. It is the Safe owner MetaMask key.',
      );
    }

    if (!cTokenAddress || !isAddress(cTokenAddress)) {
      throw new BadRequestException(
        'Confidential token address is missing. Set confidentialTokenAddress or NOX_CTOKEN_ADDRESS.',
      );
    }

    if (!request.safeAddress || !isAddress(request.safeAddress)) {
      throw new BadRequestException(
        'Link the organization Safe. USDC is wrapped from the Safe into confidential tokens.',
      );
    }

    const network = resolveNetworkConfig(request.network, rpcOverride);
    if (network.chainId !== sepolia.id) {
      throw new BadRequestException(
        `Nox is configured for Ethereum Sepolia (${sepolia.id}). Current: ${network.key} (${network.chainId}).`,
      );
    }

    const { payable, skippedZeroPay } = this.validateItems(request.items);
    if (payable.length === 0) {
      throw new BadRequestException(
        'No payable payroll items with wallet addresses and positive amounts.',
      );
    }
    if (payable.length > MAX_NOX_TRANSFERS) {
      throw new BadRequestException(
        `At most ${MAX_NOX_TRANSFERS} confidential transfers per execute.`,
      );
    }

    const normalizedKey = ownerKey.startsWith('0x')
      ? (ownerKey as Hex)
      : (`0x${ownerKey}` as Hex);
    const account = privateKeyToAccount(normalizedKey);
    const safeAddress = request.safeAddress as Address;
    const cToken = cTokenAddress as Address;
    const payer = account.address;
    const rpcUrl = network.rpcUrl;

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    });

    const totalBase = payable.reduce(
      (sum, item) =>
        sum + centsToUsdcBaseUnits(item.amountCents, network.usdcDecimals),
      0n,
    );
    const totalCents = payable.reduce((sum, item) => sum + item.amountCents, 0);
    const needUsdc = formatUnits(totalBase, network.usdcDecimals);

    const underlying = await this.resolveUnderlying(publicClient, cToken);
    await this.assertSafeUsdcBalance(
      publicClient,
      underlying,
      safeAddress,
      totalBase,
      needUsdc,
    );

    const ownerEth = await publicClient.getBalance({ address: payer });
    if (ownerEth === 0n) {
      throw new BadRequestException(
        `Owner EOA ${payer} needs Sepolia ETH for gas on confidentialTransfer txs (MetaMask). Safe only pays for the wrap batch.`,
      );
    }

    const protocolKit = await Safe.init({
      provider: rpcUrl,
      signer: normalizedKey,
      safeAddress,
    });

    const owners = (await protocolKit.getOwners()).map((o) => o.toLowerCase());
    if (!owners.includes(payer.toLowerCase())) {
      throw new BadRequestException(
        `Key wallet ${payer} is not an owner of Safe ${safeAddress}. Owners: ${owners.join(', ')}.`,
      );
    }

    this.logger.log(
      `Nox payroll ${request.payrollId}: wrap from Safe ${safeAddress} → cToken to owner ${payer}, then ${payable.length} EOA confidential transfers (${formatUsd(totalCents)})`,
    );

    let wrapHash: string | null = null;
    const wrappedBefore = await this.readInferredSupply(publicClient, cToken);

    const wrapTxs: MetaTransactionData[] = [
      {
        to: underlying,
        value: '0',
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [cToken, totalBase],
        }),
        operation: OperationType.Call,
      },
      {
        to: cToken,
        value: '0',
        data: encodeFunctionData({
          abi: ERC7984_ABI,
          functionName: 'wrap',
          args: [payer, totalBase],
        }),
        operation: OperationType.Call,
      },
    ];

    const wrapResult = await this.executeSafeBatch({
      protocolKit,
      transactions: wrapTxs,
      accountAddress: payer,
      safeAddress,
      apiKey,
      chainId: network.chainId,
      phase: 'Safe approve+wrap USDC → cToken to owner EOA',
      publicClient,
    });

    if (wrapResult.status === 'BLOCKCHAIN_PENDING') {
      return {
        ...wrapResult.result,
        message: `${wrapResult.result.message} After wrap is executed, re-run payroll execute to send confidential pays.`,
      };
    }

    wrapHash = wrapResult.hash;
    const wrappedAfter = await this.readInferredSupply(publicClient, cToken);
    if (wrappedAfter < wrappedBefore + totalBase) {
      throw new BadRequestException(
        `Safe wrap did not lock payroll USDC in cToken. Before: ${formatUnits(wrappedBefore, 6)} USDC in wrapper, after: ${formatUnits(wrappedAfter, 6)} (expected +${needUsdc}). Check wrap tx ${wrapHash}.`,
      );
    }
    this.logger.log(
      `Wrap locked ${needUsdc} USDC in cToken (wrapper balance ${formatUnits(wrappedAfter, 6)}). Tx: ${wrapHash}`,
    );
    await this.waitForConfidentialBalance(publicClient, cToken, payer);

    const handleClient = await createViemHandleClient(
      walletClient as WalletClient,
    );

    const txHashes: string[] = [];
    const amountHandles: string[] = [];
    const failures: Array<{ employeeId: string; reason: string }> = [];

    for (const item of payable) {
      const label = item.employeeName?.trim() || item.employeeId;
      try {
        const amount = centsToUsdcBaseUnits(
          item.amountCents,
          network.usdcDecimals,
        );
        const { handle, handleProof } = await handleClient.encryptInput(
          amount,
          'uint256',
          cToken,
        );

        const hash = await walletClient.writeContract({
          address: cToken,
          abi: ERC7984_ABI,
          functionName: 'confidentialTransfer',
          args: [
            item.walletAddress as Address,
            handle as Hex,
            handleProof as Hex,
          ],
          account,
          chain: sepolia,
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          timeout: 90_000,
          pollingInterval: 2_000,
        });
        if (receipt.status !== 'success') {
          throw new Error(`confidentialTransfer mined as failed (${hash})`);
        }

        txHashes.push(hash);
        amountHandles.push(handle);
        this.logger.log(
          `Nox confidentialTransfer → ${label} ${item.walletAddress}: ${hash}`,
        );
      } catch (err) {
        const reason = explainNoxTransferError(err, payer);
        this.logger.error(`Nox transfer failed for ${label}: ${reason}`);
        failures.push({ employeeId: item.employeeId, reason });
      }
    }

    const paid = payable.length - failures.length;
    const skipNote =
      skippedZeroPay > 0
        ? ` Skipped ${skippedZeroPay} zero-pay line item${skippedZeroPay === 1 ? '' : 's'}.`
        : '';
    const lastHash = txHashes[txHashes.length - 1] ?? wrapHash;

    if (paid === 0) {
      throw new BadRequestException(
        `All ${payable.length} confidential transfers failed after wrap. ${failures[0]?.reason ?? 'unknown'}`,
      );
    }

    if (failures.length) {
      return {
        success: true,
        status: 'BLOCKCHAIN_PENDING',
        message: `Partial Nox payroll: ${paid}/${payable.length} confidential pays sent. Wrap: ${wrapHash ?? 'skipped'}. Failures: ${failures.map((f) => f.reason).join('; ')}.${skipNote}`,
        provider: this.kind,
        transactionHash: lastHash,
        externalReference: lastHash ?? amountHandles[0] ?? null,
        processedAt: new Date().toISOString(),
        failures,
      };
    }

    return {
      success: true,
      status: 'COMPLETED',
      message: `Confidential Nox payroll: Safe locked ${formatUsd(totalCents)} USDC into cToken ${cToken} (wrap ${wrapHash}), then ${paid} encrypted transfer${paid === 1 ? '' : 's'} on ${network.name}. Recipients hold confidential cToken balances (not plain USDC in MetaMask). Last pay: ${lastHash}.${skipNote}`,
      provider: this.kind,
      transactionHash: lastHash,
      externalReference: amountHandles[0] ?? lastHash ?? `nox_${request.payrollId}`,
      processedAt: new Date().toISOString(),
      failures: [],
    };
  }

  private async readInferredSupply(
    publicClient: PublicClient,
    cToken: Address,
  ): Promise<bigint> {
    try {
      return (await publicClient.readContract({
        address: cToken,
        abi: [
          {
            type: 'function',
            name: 'inferredTotalSupply',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ type: 'uint256' }],
          },
        ] as const,
        functionName: 'inferredTotalSupply',
      })) as bigint;
    } catch {
      return 0n;
    }
  }

  private async executeSafeBatch(params: {
    protocolKit: SafeKit;
    transactions: MetaTransactionData[];
    accountAddress: string;
    safeAddress: string;
    apiKey?: string;
    chainId: number;
    phase: string;
    publicClient: PublicClient;
  }): Promise<
    | { status: 'EXECUTED'; hash: string }
    | {
        status: 'BLOCKCHAIN_PENDING';
        hash: null;
        result: ExecutePayrollPaymentResult;
      }
  > {
    const {
      protocolKit,
      transactions,
      accountAddress,
      safeAddress,
      apiKey,
      chainId,
      phase,
      publicClient,
    } = params;

    const safeTransaction = await protocolKit.createTransaction({
      transactions,
    });
    const signedTx = await protocolKit.signTransaction(safeTransaction);
    const threshold = await protocolKit.getThreshold();
    const signatures = countSignatures(signedTx);

    this.logger.log(
      `Safe batch "${phase}": ${transactions.length} call(s), sigs ${signatures}/${threshold}`,
    );

    if (signatures < threshold) {
      const safeTxHash = await protocolKit.getTransactionHash(signedTx);
      try {
        const apiKit = new SafeApiKit({
          chainId: BigInt(chainId),
          ...(apiKey ? { apiKey } : {}),
        });
        const senderSignature = await protocolKit.signHash(safeTxHash);
        await apiKit.proposeTransaction({
          safeAddress,
          safeTransactionData: signedTx.data,
          safeTxHash,
          senderAddress: accountAddress,
          senderSignature: senderSignature.data,
        });
      } catch (err) {
        this.logger.warn(
          `Could not propose Safe tx (${phase}): ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }

      return {
        status: 'BLOCKCHAIN_PENDING',
        hash: null,
        result: {
          success: true,
          status: 'BLOCKCHAIN_PENDING',
          message: `Safe batch proposed for "${phase}" (${signatures}/${threshold}). Collect remaining signatures, then re-run execute. safeTxHash=${safeTxHash}`,
          provider: this.kind,
          transactionHash: null,
          externalReference: safeTxHash,
          processedAt: new Date().toISOString(),
          failures: [],
        },
      };
    }

    try {
      const executeResult = await protocolKit.executeTransaction(signedTx);
      const hash = extractTxHash(executeResult);
      if (hash) {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: hash as Hex,
          timeout: 90_000,
          pollingInterval: 2_000,
        });
        if (receipt.status !== 'success') {
          throw new Error(
            `Safe execTransaction failed on-chain for "${phase}" (tx ${hash})`,
          );
        }
      }
      this.logger.log(`Safe batch "${phase}" ok: ${hash || 'no hash'}`);
      return { status: 'EXECUTED', hash: hash || '' };
    } catch (err) {
      throw new BadRequestException(explainSafeExecError(err, phase, safeAddress));
    }
  }

  private async waitForConfidentialBalance(
    publicClient: PublicClient,
    cToken: Address,
    account: Address,
  ): Promise<void> {
    const attempts = 6;
    for (let i = 0; i < attempts; i += 1) {
      const balanceHandle = (await publicClient.readContract({
        address: cToken,
        abi: ERC7984_ABI,
        functionName: 'confidentialBalanceOf',
        args: [account],
      })) as Hex;

      if (balanceHandle && balanceHandle !== ZERO_HANDLE) {
        this.logger.log(
          `Confidential balance handle ready for ${account} (attempt ${i + 1})`,
        );
        return;
      }

      this.logger.warn(
        `Waiting for confidential balance on ${account} (${i + 1}/${attempts})…`,
      );
      await sleep(1_500);
    }

    throw new BadRequestException(
      `Wrap completed but confidentialBalanceOf(${account}) is still empty. Wait ~20s and re-run execute (wrap is skipped if the handle is already there). Status: https://status.noxprotocol.io`,
    );
  }

  private validateItems(items: PayrollPaymentItem[]): {
    payable: PayrollPaymentItem[];
    skippedZeroPay: number;
  } {
    const failures: string[] = [];
    const payable: PayrollPaymentItem[] = [];
    let skippedZeroPay = 0;

    for (const item of items) {
      if (item.amountCents <= 0) {
        skippedZeroPay += 1;
        continue;
      }
      if (!item.walletAddress || !isAddress(item.walletAddress)) {
        const label = item.employeeName?.trim() || item.employeeId;
        failures.push(`${label} is missing a valid payout wallet`);
        continue;
      }
      payable.push(item);
    }

    if (failures.length) {
      const preview = failures.slice(0, 8).join('; ');
      const more = failures.length > 8 ? `; +${failures.length - 8} more` : '';
      throw new BadRequestException(
        `${failures.length} payable employee(s) cannot be paid: ${preview}${more}.`,
      );
    }

    return { payable, skippedZeroPay };
  }

  private async resolveUnderlying(
    publicClient: PublicClient,
    cToken: Address,
  ): Promise<Address> {
    try {
      const underlying = (await publicClient.readContract({
        address: cToken,
        abi: ERC7984_ABI,
        functionName: 'underlying',
      })) as Address;
      if (!underlying || !isAddress(underlying)) throw new Error('invalid');
      return underlying;
    } catch {
      throw new BadRequestException(
        'Confidential token has no underlying(). Use the WrappedSepoliaUSDC wrapper.',
      );
    }
  }

  private async assertSafeUsdcBalance(
    publicClient: PublicClient,
    usdc: Address,
    safeAddress: Address,
    totalBase: bigint,
    needUsdc: string,
  ): Promise<void> {
    const balance = (await publicClient.readContract({
      address: usdc,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [safeAddress],
    })) as bigint;

    if (balance < totalBase) {
      throw new BadRequestException(
        `Safe ${safeAddress} needs ≥ ${needUsdc} Sepolia USDC (has ${formatUnits(balance, 6)}).`,
      );
    }

    const eth = await publicClient.getBalance({ address: safeAddress });
    if (eth === 0n) {
      throw new BadRequestException(
        `Safe ${safeAddress} has 0 ETH. Send a little Sepolia ETH for the wrap batch gas.`,
      );
    }
  }
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function countSignatures(signedTx: SafeTransaction): number {
  const sigs = signedTx.signatures;
  if (!sigs) return 0;
  if (typeof (sigs as Map<string, unknown>).size === 'number') {
    return (sigs as Map<string, unknown>).size;
  }
  return Object.keys(sigs).length;
}

function extractTxHash(executeResult: unknown): string {
  if (!executeResult || typeof executeResult !== 'object') return '';
  const r = executeResult as {
    hash?: string;
    transactionResponse?: { hash?: string };
  };
  return String(r.hash ?? r.transactionResponse?.hash ?? '');
}

function explainSafeExecError(
  err: unknown,
  phase: string,
  safeAddress: string,
): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('GS013')) {
    return (
      `Safe GS013 during "${phase}" (Safe ${safeAddress}): an inner call reverted. ` +
      `Check Safe USDC, cToken underlying, and Safe ETH. Detail: ${raw.slice(0, 350)}`
    );
  }
  return `Safe batch "${phase}" failed: ${raw.slice(0, 600)}`;
}

function explainNoxTransferError(err: unknown, payer: string): string {
  if (err instanceof BaseError) {
    const reverted = err.walk(
      (e) => e instanceof ContractFunctionRevertedError,
    ) as ContractFunctionRevertedError | null;
    const name = reverted?.data?.errorName;
    if (name === 'ERC7984ZeroBalance' || err.message.includes('0x5ff91cdc')) {
      return `ERC7984ZeroBalance: owner ${payer} has no confidential cToken. Re-run execute so the Safe wrap step mints cToken to this EOA.`;
    }
    if (name === 'ERC7984UnauthorizedUseOfEncryptedAmount') {
      return `Unauthorized encrypted amount: re-encrypt against the cToken contract address.`;
    }
    if (name) return `${name}: ${reverted?.shortMessage ?? err.shortMessage}`;
    return err.shortMessage || err.message;
  }
  return err instanceof Error ? err.message : String(err);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
