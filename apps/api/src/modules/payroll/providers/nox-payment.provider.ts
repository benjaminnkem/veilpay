import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createViemHandleClient } from '@iexec-nox/handle';
import type {
  ExecutePayrollPaymentRequest,
  ExecutePayrollPaymentResult,
  PayrollPaymentItem,
} from '@repo/types';
import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  type Address,
  type Hex,
  type WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import type { PaymentProvider } from './payment-provider.interface';
import { centsToUsdcBaseUnits, resolveNetworkConfig } from './network.config';
import { ERC20_ABI, ERC7984_ABI } from './erc7984.abi';

const MAX_NOX_TRANSFERS = 40;

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
    const cTokenAddress = (
      request.confidentialTokenAddress ||
      this.config.get<string>('blockchain.noxCtokenAddress') ||
      ''
    ).trim();

    if (!ownerKey) {
      throw new ServiceUnavailableException(
        'NOX_PAYER_PRIVATE_KEY (or SAFE_OWNER_PRIVATE_KEY) is not configured for confidential Nox payroll.',
      );
    }

    if (!cTokenAddress || !isAddress(cTokenAddress)) {
      throw new BadRequestException(
        'Confidential token address is missing. Set confidentialTokenAddress on the organization (ERC-7984 wrapper) or NOX_CTOKEN_ADDRESS in the API env.',
      );
    }

    const network = resolveNetworkConfig(request.network, rpcOverride);
    if (network.chainId !== sepolia.id) {
      throw new BadRequestException(
        `Nox confidential payroll is available on Ethereum Sepolia (chain ${sepolia.id}). Current network is ${network.key} (${network.chainId}).`,
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
        `This payroll has ${payable.length} confidential transfers. Split into runs of at most ${MAX_NOX_TRANSFERS} for the Nox path.`,
      );
    }

    const normalizedKey = ownerKey.startsWith('0x')
      ? (ownerKey as Hex)
      : (`0x${ownerKey}` as Hex);
    const account = privateKeyToAccount(normalizedKey);
    const rpcUrl = network.rpcUrl;
    const cToken = cTokenAddress as Address;

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

    await this.ensureWrappedBalance({
      publicClient,
      walletClient,
      cToken,
      payer: account.address,
      totalBase,
      usdcAddress: network.usdcAddress as Address,
    });

    this.logger.log(
      `Nox payroll ${request.payrollId}: encrypting and confidential-transferring ${payable.length} recipient(s) totaling ${formatUsd(totalCents)} from ${account.address}`,
    );

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

        await publicClient.waitForTransactionReceipt({ hash });
        txHashes.push(hash);
        amountHandles.push(handle);
        this.logger.log(
          `Nox confidential transfer to ${label} (${item.walletAddress}): ${hash}`,
        );
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        this.logger.error(`Nox transfer failed for ${label}: ${reason}`);
        failures.push({ employeeId: item.employeeId, reason });
      }
    }

    const paid = payable.length - failures.length;
    const skipNote =
      skippedZeroPay > 0
        ? ` Skipped ${skippedZeroPay} zero-pay line item${skippedZeroPay === 1 ? '' : 's'}.`
        : '';
    const lastHash = txHashes[txHashes.length - 1] ?? null;

    if (paid === 0) {
      return {
        success: false,
        status: 'FAILED',
        message: `All ${payable.length} confidential Nox transfers failed. First error: ${failures[0]?.reason ?? 'unknown'}`,
        provider: this.kind,
        transactionHash: null,
        externalReference: `nox_failed_${request.payrollId}_${Date.now()}`,
        processedAt: new Date().toISOString(),
        failures,
      };
    }

    if (failures.length) {
      return {
        success: true,
        status: 'BLOCKCHAIN_PENDING',
        message: `Partial Nox payroll: ${paid}/${payable.length} confidential transfers submitted on ${network.name}.${skipNote} Failed: ${failures.map((f) => f.reason).join('; ')}`,
        provider: this.kind,
        transactionHash: lastHash,
        externalReference: lastHash ?? `nox_partial_${request.payrollId}`,
        processedAt: new Date().toISOString(),
        failures,
      };
    }

    return {
      success: true,
      status: 'COMPLETED',
      message: `Confidential Nox payroll: ${paid} encrypted ERC-7984 transfer${paid === 1 ? '' : 's'} totaling ${formatUsd(totalCents)} on ${network.name}. Amounts are handles (not public). Last tx: ${lastHash}.${skipNote}`,
      provider: this.kind,
      transactionHash: lastHash,
      externalReference:
        amountHandles[0] ?? lastHash ?? `nox_${request.payrollId}`,
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
      const more = failures.length > 8 ? `; +${failures.length - 8} more` : '';
      throw new BadRequestException(
        `${failures.length} payable employee(s) cannot be paid confidentially: ${preview}${more}.`,
      );
    }

    return { payable, skippedZeroPay };
  }

  private async ensureWrappedBalance(params: {
    publicClient: ReturnType<typeof createPublicClient>;
    walletClient: ReturnType<typeof createWalletClient>;
    cToken: Address;
    payer: Address;
    totalBase: bigint;
    usdcAddress: Address;
  }): Promise<void> {
    const { publicClient, walletClient, cToken, payer, totalBase } = params;

    let underlying: Address | null = null;
    try {
      underlying = (await publicClient.readContract({
        address: cToken,
        abi: ERC7984_ABI,
        functionName: 'underlying',
      })) as Address;
    } catch {
      this.logger.warn(
        'cToken has no underlying() — treating as native confidential token (skip auto-wrap)',
      );
      return;
    }

    if (!underlying || !isAddress(underlying)) return;

    const usdcBalance = (await publicClient.readContract({
      address: underlying,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [payer],
    })) as bigint;

    if (usdcBalance < totalBase) {
      this.logger.warn(
        `Payer ${payer} has only ${usdcBalance.toString()} underlying USDC (need ${totalBase.toString()}). Skipping auto-wrap; confidential balance must already cover payroll.`,
      );
      return;
    }

    const allowance = (await publicClient.readContract({
      address: underlying,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [payer, cToken],
    })) as bigint;

    if (allowance < totalBase) {
      const approveHash = await walletClient.writeContract({
        address: underlying,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [cToken, totalBase],
        account: walletClient.account!,
        chain: sepolia,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    const wrapHash = await walletClient.writeContract({
      address: cToken,
      abi: ERC7984_ABI,
      functionName: 'wrap',
      args: [payer, totalBase],
      account: walletClient.account!,
      chain: sepolia,
    });
    await publicClient.waitForTransactionReceipt({ hash: wrapHash });
    this.logger.log(
      `Wrapped ${totalBase.toString()} USDC into confidential token for ${payer}: ${wrapHash}`,
    );
  }
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
