import { HttpStatus, Injectable } from '@nestjs/common';
import Safe, { adjustVInSignature } from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import {
  OperationType,
  SigningMethod,
  type MetaTransactionData,
  type SafeTransactionData,
} from '@safe-global/types-kit';
import {
  encodeFunctionData,
  getAddress,
  keccak256,
  recoverAddress,
  stringToHex,
  verifyMessage,
  type Address,
  type Hash,
  type Hex,
} from 'viem';
import { ApiError } from '../common/api-error';
import { jsonSafe } from '../common/http';
import { CompaniesService } from '../companies/companies.service';
import { PrismaService } from '../database/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { payrollAbi, tokenAbi } from '../blockchain/abis';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SafeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companies: CompaniesService,
    private readonly blockchain: BlockchainService,
    private readonly audit: AuditService,
  ) {}
  private async kit(address: string, signer?: string) {
    return Safe.init({
      provider: process.env.WEB3_RPC_URL!,
      signer,
      safeAddress: address,
    });
  }

  async deploymentIntent(userId: string, companyId: string) {
    await this.companies.assertRole(userId, companyId, ['OWNER', 'ADMIN']);
    const existing = await this.prisma.safeAccount.findUnique({
      where: {
        companyId_chainId: { companyId, chainId: this.blockchain.chainId },
      },
    });
    if (existing?.status === 'VERIFIED')
      throw new ApiError(
        'SAFE_ALREADY_CONFIGURED',
        'Company Safe is already configured',
        HttpStatus.CONFLICT,
      );
    const wallet = await this.prisma.wallet.findFirst({
      where: { userId, isPrimary: true },
    });
    if (!wallet)
      throw new ApiError(
        'WALLET_VERIFICATION_REQUIRED',
        'A verified primary wallet is required',
      );
    const saltNonce = BigInt(
      keccak256(stringToHex(`veilpay:${companyId}:${this.blockchain.chainId}`)),
    ).toString();
    const protocolKit = await Safe.init({
      provider: process.env.WEB3_RPC_URL!,
      signer: wallet.address,
      predictedSafe: {
        safeAccountConfig: { owners: [wallet.address], threshold: 1 },
        safeDeploymentConfig: { saltNonce, safeVersion: '1.4.1' },
      },
    });
    const predictedAddress = getAddress(await protocolKit.getAddress());
    const tx = await protocolKit.createSafeDeploymentTransaction();
    const expiresAt = new Date(Date.now() + 3600_000);
    const intent = await this.prisma.$transaction(async (db) => {
      const account = await db.safeAccount.upsert({
        where: {
          companyId_chainId: { companyId, chainId: this.blockchain.chainId },
        },
        update: { predictedAddress },
        create: {
          companyId,
          chainId: this.blockchain.chainId,
          predictedAddress,
        },
      });
      return db.safeDeploymentIntent.create({
        data: {
          companyId,
          safeAccountId: account.id,
          walletId: wallet.id,
          chainId: this.blockchain.chainId,
          to: getAddress(tx.to),
          value: tx.value,
          data: tx.data,
          predictedAddress,
          saltNonce,
          expiresAt,
        },
      });
    });
    return jsonSafe({
      intentId: intent.id,
      chainId: this.blockchain.chainId,
      predictedSafeAddress: predictedAddress,
      transaction: { to: tx.to, value: tx.value, data: tx.data },
    });
  }

  async submitDeployment(
    userId: string,
    companyId: string,
    intentId: string,
    txHash: Hash,
  ) {
    await this.companies.assertRole(userId, companyId, ['OWNER', 'ADMIN']);
    const intent = await this.prisma.safeDeploymentIntent.findFirst({
      where: { id: intentId, companyId },
      include: { wallet: true, safeAccount: true },
    });
    if (!intent)
      throw new ApiError(
        'SAFE_INTENT_NOT_FOUND',
        'Safe deployment intent not found',
        HttpStatus.NOT_FOUND,
      );
    if (intent.status === 'VERIFIED') return intent.safeAccount;
    if (intent.expiresAt <= new Date())
      throw new ApiError(
        'SAFE_INTENT_EXPIRED',
        'Safe deployment intent expired',
      );
    await this.prisma.safeDeploymentIntent.update({
      where: { id: intent.id },
      data: { txHash, status: 'SUBMITTED' },
    });
    const receipt = await this.blockchain.verifiedReceipt(txHash);
    const code = await this.blockchain.code(intent.predictedAddress as Address);
    if (!code || code === '0x')
      throw new ApiError(
        'SAFE_DEPLOYMENT_NOT_CONFIRMED',
        'No Safe code at predicted address',
      );
    const protocolKit = await this.kit(intent.predictedAddress);
    const owners = (await protocolKit.getOwners()).map(getAddress);
    const threshold = await protocolKit.getThreshold();
    if (
      threshold !== 1 ||
      owners.length !== 1 ||
      owners[0] !== getAddress(intent.wallet.address)
    )
      throw new ApiError(
        'SAFE_OWNER_MISMATCH',
        'Deployed Safe owner or threshold does not match intent',
      );
    const account = await this.prisma.$transaction(async (db) => {
      await db.safeDeploymentIntent.update({
        where: { id: intent.id },
        data: { status: 'VERIFIED' },
      });
      await db.company.update({
        where: { id: companyId },
        data: { status: 'ACTIVE' },
      });
      return db.safeAccount.update({
        where: { id: intent.safeAccountId },
        data: {
          address: intent.predictedAddress,
          status: 'VERIFIED',
          threshold,
          deploymentTxHash: txHash,
          deployedAt: new Date(),
          lastSyncedAt: new Date(),
        },
      });
    });
    await this.audit.record(
      userId,
      companyId,
      'SAFE_DEPLOYED',
      'SafeAccount',
      account.id,
      { txHash, blockNumber: receipt.blockNumber.toString() },
    );
    return account;
  }

  async get(userId: string, companyId: string) {
    await this.companies.assertRole(userId, companyId);
    return this.prisma.safeAccount.findUnique({
      where: {
        companyId_chainId: { companyId, chainId: this.blockchain.chainId },
      },
    });
  }
  async sync(userId: string, companyId: string) {
    await this.companies.assertRole(userId, companyId);
    const account = await this.get(userId, companyId);
    if (!account?.address)
      throw new ApiError('SAFE_NOT_CONFIGURED', 'Safe is not configured');
    const kit = await this.kit(account.address);
    const [owners, threshold, deployed] = await Promise.all([
      kit.getOwners(),
      kit.getThreshold(),
      kit.isSafeDeployed(),
    ]);
    if (!deployed)
      throw new ApiError(
        'SAFE_DEPLOYMENT_NOT_CONFIRMED',
        'Safe is not deployed',
      );
    await this.prisma.safeAccount.update({
      where: { id: account.id },
      data: { threshold, status: 'VERIFIED', lastSyncedAt: new Date() },
    });
    return { ...account, owners, threshold, deployed };
  }

  async fundingIntent(userId: string, companyId: string, amount: string) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'FINANCE',
    ]);
    if (
      !/^\d+$/.test(amount) ||
      BigInt(amount) <= 0n ||
      BigInt(amount) > 100_000n * 1_000_000n
    )
      throw new ApiError(
        'FUNDING_AMOUNT_INVALID',
        'Funding amount must be positive integer base units within faucet cap',
      );
    const safe = await this.get(userId, companyId);
    if (!safe?.address || safe.status !== 'VERIFIED')
      throw new ApiError('SAFE_NOT_CONFIGURED', 'Verified Safe required');
    const to = getAddress(process.env.CONFIDENTIAL_TOKEN_ADDRESS!);
    const data = encodeFunctionData({
      abi: tokenAbi,
      functionName: 'faucet',
      args: [getAddress(safe.address), BigInt(amount)],
    });
    const intent = await this.prisma.fundingIntent.create({
      data: {
        companyId,
        chainId: this.blockchain.chainId,
        to,
        value: '0',
        data,
        amountBaseUnits: amount,
        expiresAt: new Date(Date.now() + 3600_000),
      },
    });
    return {
      intentId: intent.id,
      chainId: this.blockchain.chainId,
      transaction: { to, value: '0', data },
      privacyNotice:
        'The test faucet recipient, amount, and timing are public.',
    };
  }
  async submitFunding(
    userId: string,
    companyId: string,
    intentId: string,
    txHash: Hash,
  ) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'FINANCE',
    ]);
    const intent = await this.prisma.fundingIntent.findFirst({
      where: { id: intentId, companyId },
    });
    if (!intent)
      throw new ApiError(
        'FUNDING_INTENT_NOT_FOUND',
        'Funding intent not found',
        HttpStatus.NOT_FOUND,
      );
    if (intent.status === 'VERIFIED') return intent;
    await this.prisma.fundingIntent.update({
      where: { id: intent.id },
      data: { txHash, status: 'SUBMITTED' },
    });
    await this.blockchain.verifiedReceipt(txHash);
    const safe = await this.get(userId, companyId);
    const handle = await this.balanceHandle(getAddress(safe!.address!));
    if (/^0x0+$/.test(handle))
      throw new ApiError(
        'FUNDING_BALANCE_NOT_VERIFIED',
        'Confidential balance handle was not created',
      );
    return this.prisma.fundingIntent.update({
      where: { id: intent.id },
      data: { status: 'VERIFIED', balanceHandle: handle },
    });
  }
  async balanceHandle(address: Address): Promise<Hex> {
    return this.blockchain.publicClient.readContract({
      address: getAddress(process.env.CONFIDENTIAL_TOKEN_ADDRESS!),
      abi: tokenAbi,
      functionName: 'confidentialBalanceOf',
      args: [address],
    });
  }

  async buildPayrollTransaction(payroll: {
    id: string;
    companyId: string;
    onchainPayrollId: string;
    manifestHash: string | null;
    tokenAddress: string;
    payrollContractAddress: string;
    itemCount: number;
    deadline: Date | null;
    safeAccount: { address: string | null };
  }) {
    if (
      !payroll.safeAccount.address ||
      !payroll.manifestHash ||
      !payroll.deadline
    )
      throw new ApiError(
        'PAYROLL_NOT_PREPARED',
        'Prepared payroll data is incomplete',
      );
    const deadline = Math.floor(payroll.deadline.getTime() / 1000);
    const calls: MetaTransactionData[] = [
      {
        to: payroll.tokenAddress,
        value: '0',
        data: encodeFunctionData({
          abi: tokenAbi,
          functionName: 'setOperator',
          args: [getAddress(payroll.payrollContractAddress), deadline],
        }),
        operation: OperationType.Call,
      },
      {
        to: payroll.payrollContractAddress,
        value: '0',
        data: encodeFunctionData({
          abi: payrollAbi,
          functionName: 'approvePayroll',
          args: [
            payroll.onchainPayrollId as Hex,
            payroll.manifestHash as Hex,
            getAddress(payroll.tokenAddress),
            payroll.itemCount,
            deadline,
          ],
        }),
        operation: OperationType.Call,
      },
    ];
    const kit = await this.kit(payroll.safeAccount.address);
    const safeTx = await kit.createTransaction({
      transactions: calls,
      onlyCalls: true,
    });
    const safeTxHash = await kit.getTransactionHash(safeTx);
    return { safeTx, safeTxHash, calls };
  }

  async propose(
    safeAddress: Address,
    safeTxHash: Hex,
    safeTransactionData: SafeTransactionData,
    senderAddress: Address,
    signature: Hex,
  ) {
    const kit = await this.kit(safeAddress);
    const owners = (await kit.getOwners()).map(getAddress);
    const sender = getAddress(senderAddress);
    if (!owners.includes(sender))
      throw new ApiError(
        'SAFE_OWNER_MISMATCH',
        'Signer is not a current Safe owner',
        HttpStatus.FORBIDDEN,
      );
    let serviceSignature = signature;
    const prefixSigned = await verifyMessage({
      address: sender,
      message: { raw: safeTxHash },
      signature,
    });
    if (prefixSigned)
      serviceSignature = (await adjustVInSignature(
        SigningMethod.ETH_SIGN,
        signature,
        safeTxHash,
        sender,
      )) as Hex;
    else {
      let recovered: string;
      try {
        recovered = await recoverAddress({ hash: safeTxHash, signature });
      } catch {
        throw new ApiError(
          'SAFE_SIGNATURE_INVALID',
          'Safe signature is invalid',
        );
      }
      if (getAddress(recovered) !== sender)
        throw new ApiError(
          'SAFE_SIGNATURE_INVALID',
          'Safe signature does not match sender',
        );
    }
    const api = new SafeApiKit({
      chainId: BigInt(this.blockchain.chainId),
      txServiceUrl: process.env.SAFE_TRANSACTION_SERVICE_URL,
      apiKey: process.env.SAFE_API_KEY,
    });
    await api.proposeTransaction({
      safeAddress,
      safeTxHash,
      safeTransactionData,
      senderAddress: sender,
      senderSignature: serviceSignature,
      origin: 'VeilPay',
    });
    return { sender, serviceSignature };
  }
}
