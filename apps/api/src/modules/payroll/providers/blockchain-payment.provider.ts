import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SafeApiKit from '@safe-global/api-kit';
import Safe from '@safe-global/protocol-kit';
import {
  OperationType,
  type MetaTransactionData,
} from '@safe-global/types-kit';
import type {
  ExecutePayrollPaymentRequest,
  ExecutePayrollPaymentResult,
  PayrollPaymentItem,
} from '@repo/types';
import {
  createPublicClient,
  encodeFunctionData,
  erc20Abi,
  http,
  isAddress,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { PaymentProvider } from './payment-provider.interface';
import { centsToUsdcBaseUnits, resolveNetworkConfig } from './network.config';

const MAX_TRANSFERS_PER_SAFE_TX = 75;

@Injectable()
export class BlockchainPaymentProvider implements PaymentProvider {
  readonly kind = 'blockchain' as const;
  private readonly logger = new Logger(BlockchainPaymentProvider.name);

  constructor(private readonly config: ConfigService) {}

  async executePayroll(
    request: ExecutePayrollPaymentRequest,
  ): Promise<ExecutePayrollPaymentResult> {
    const ownerKey = this.config.get<string>('blockchain.safeOwnerPrivateKey');
    const rpcOverride = this.config.get<string>('blockchain.rpcUrl');
    const apiKey = this.config.get<string>('blockchain.safeApiKey');

    if (!ownerKey) {
      throw new ServiceUnavailableException(
        'SAFE_OWNER_PRIVATE_KEY is not configured. Set it in apps/api/.env to execute Safe payrolls.',
      );
    }

    if (!request.safeAddress || !isAddress(request.safeAddress)) {
      throw new BadRequestException(
        'Organization Safe address is missing or invalid. Link a treasury in Settings first.',
      );
    }

    const network = resolveNetworkConfig(request.network, rpcOverride);
    const { payable, skippedZeroPay } = this.validateItems(request.items);

    if (payable.length === 0) {
      throw new BadRequestException(
        'No payable payroll items with wallet addresses and positive amounts.',
      );
    }

    if (payable.length > MAX_TRANSFERS_PER_SAFE_TX) {
      throw new BadRequestException(
        `This payroll has ${payable.length} on-chain transfers. Split into multiple runs of at most ${MAX_TRANSFERS_PER_SAFE_TX} payable employees per Safe transaction.`,
      );
    }

    const normalizedKey = ownerKey.startsWith('0x')
      ? (ownerKey as Hex)
      : (`0x${ownerKey}` as Hex);
    const account = privateKeyToAccount(normalizedKey);
    const totalCents = payable.reduce((sum, item) => sum + item.amountCents, 0);

    await this.assertUsdcBalance(
      network.rpcUrl,
      request.safeAddress as Address,
      network.usdcAddress as Address,
      payable,
      network.usdcDecimals,
    );

    const transactions = payable.map((item) =>
      this.buildUsdcTransfer(item, network.usdcAddress, network.usdcDecimals),
    );

    this.logger.log(
      `Executing payroll ${request.payrollId}: ${transactions.length} USDC transfer(s) totaling ${formatUsd(totalCents)} from ${request.safeAddress} on ${network.key}`,
    );

    const protocolKit = await Safe.init({
      provider: network.rpcUrl,
      signer: normalizedKey,
      safeAddress: request.safeAddress,
    });

    const safeTransaction = await protocolKit.createTransaction({
      transactions,
    });

    const signedTx = await protocolKit.signTransaction(safeTransaction);
    const threshold = await protocolKit.getThreshold();
    const signatures =
      typeof signedTx.signatures?.size === 'number'
        ? signedTx.signatures.size
        : Object.keys(signedTx.signatures ?? {}).length;

    const batchSummary = `${payable.length} recipient${payable.length === 1 ? '' : 's'} · ${formatUsd(totalCents)} USDC`;
    const skipNote =
      skippedZeroPay > 0
        ? ` Skipped ${skippedZeroPay} zero-pay line item${skippedZeroPay === 1 ? '' : 's'}.`
        : '';

    if (signatures < threshold) {
      const safeTxHash = await protocolKit.getTransactionHash(signedTx);
      try {
        const apiKit = new SafeApiKit({
          chainId: BigInt(network.chainId),
          ...(apiKey ? { apiKey } : {}),
        });
        const senderSignature = await protocolKit.signHash(safeTxHash);
        await apiKit.proposeTransaction({
          safeAddress: request.safeAddress,
          safeTransactionData: signedTx.data,
          safeTxHash,
          senderAddress: account.address,
          senderSignature: senderSignature.data,
        });
      } catch (err) {
        this.logger.warn(
          `Could not propose multi-sig tx to Safe Transaction Service: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }

      return {
        success: true,
        status: 'BLOCKCHAIN_PENDING',
        message: `Safe batch proposed (${signatures}/${threshold} signatures) for ${batchSummary} on ${network.name}.${skipNote} Collect remaining owner signatures, then execute in Safe UI or re-run execute. safeTxHash=${safeTxHash}`,
        provider: this.kind,
        transactionHash: null,
        externalReference: safeTxHash,
        processedAt: new Date().toISOString(),
        failures: [],
      };
    }

    const executeResult = await protocolKit.executeTransaction(signedTx);
    const txHash =
      typeof executeResult === 'object' &&
      executeResult &&
      'hash' in executeResult
        ? String(
            (executeResult as { hash?: string }).hash ??
              (executeResult as { transactionResponse?: { hash?: string } })
                .transactionResponse?.hash ??
              '',
          )
        : '';

    const hash =
      txHash ||
      (typeof executeResult === 'object' &&
      executeResult &&
      'transactionResponse' in executeResult
        ? String(
            (
              executeResult as {
                transactionResponse?: { hash?: string };
              }
            ).transactionResponse?.hash ?? '',
          )
        : '');

    this.logger.log(
      `Payroll ${request.payrollId} Safe execution submitted: ${hash || 'unknown hash'} (${batchSummary})`,
    );

    return {
      success: true,
      status: hash ? 'COMPLETED' : 'BLOCKCHAIN_PENDING',
      message: hash
        ? `Batched ${batchSummary} executed on ${network.name}.${skipNote} Tx: ${hash}`
        : `Safe batch for ${batchSummary} submitted on ${network.name}; confirmation pending.${skipNote}`,
      provider: this.kind,
      transactionHash: hash || null,
      externalReference: hash || `safe_exec_${request.payrollId}_${Date.now()}`,
      processedAt: new Date().toISOString(),
      failures: [],
    };
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
      const more =
        failures.length > 8
          ? `; +${failures.length - 8} more`
          : '';
      throw new BadRequestException(
        `${failures.length} payable employee(s) cannot be paid: ${preview}${more}. Ask them to link a payout wallet, then re-run execute.`,
      );
    }

    return { payable, skippedZeroPay };
  }

  private buildUsdcTransfer(
    item: PayrollPaymentItem,
    usdcAddress: string,
    decimals: number,
  ): MetaTransactionData {
    const amount = centsToUsdcBaseUnits(item.amountCents, decimals);
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [item.walletAddress as Address, amount],
    });

    return {
      to: usdcAddress,
      value: '0',
      data,
      operation: OperationType.Call,
    };
  }

  private async assertUsdcBalance(
    rpcUrl: string,
    safeAddress: Address,
    usdcAddress: Address,
    items: PayrollPaymentItem[],
    decimals: number,
  ): Promise<void> {
    const total = items.reduce(
      (sum, item) => sum + centsToUsdcBaseUnits(item.amountCents, decimals),
      0n,
    );
    const totalCents = items.reduce((sum, item) => sum + item.amountCents, 0);

    const client = createPublicClient({
      transport: http(rpcUrl),
    });

    const balance = await client.readContract({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [safeAddress],
    });

    if (balance < total) {
      throw new BadRequestException(
        `Insufficient Safe USDC for ${items.length} recipient(s). Need ${formatUsd(totalCents)} USDC (${total.toString()} base units), have ${formatUsdcBase(balance, decimals)} USDC (${balance.toString()} base units). Fund the Safe and try again.`,
      );
    }
  }
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatUsdcBase(amount: bigint, decimals: number): string {
  const factor = 10n ** BigInt(decimals);
  const whole = amount / factor;
  const frac = amount % factor;
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 2);
  return `${whole.toString()}.${fracStr}`;
}
