import { randomUUID } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { Prisma } from '@prisma/client';
import type { SafeTransactionData } from '@safe-global/types-kit';
import {
  createWalletClient,
  bytesToHex,
  decodeEventLog,
  encodeFunctionData,
  getAddress,
  http,
  keccak256,
  stringToHex,
  type Address,
  type Hash,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ApiError } from '../common/api-error';
import { CompaniesService } from '../companies/companies.service';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../database/prisma.service';
import { NoxService } from '../nox/nox.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { payrollAbi, tokenAbi } from '../blockchain/abis';
import { SafeService } from '../safe/safe.service';
import { ManifestService } from './manifest.service';
import { PayrollStateService } from './payroll-state.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companies: CompaniesService,
    private readonly crypto: FieldEncryptionService,
    private readonly nox: NoxService,
    private readonly blockchain: BlockchainService,
    private readonly safe: SafeService,
    private readonly manifest: ManifestService,
    private readonly states: PayrollStateService,
    private readonly audit: AuditService,
  ) {}
  async create(
    userId: string,
    companyId: string,
    label: string,
    employeeIds: string[] | undefined,
    expiresInSeconds: number,
  ) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'HR',
    ]);
    const safe = await this.prisma.safeAccount.findUnique({
      where: {
        companyId_chainId: { companyId, chainId: this.blockchain.chainId },
      },
    });
    if (!safe?.address || safe.status !== 'VERIFIED')
      throw new ApiError(
        'SAFE_NOT_CONFIGURED',
        'A verified company Safe is required',
      );
    const employees = await this.prisma.employeeProfile.findMany({
      where: {
        companyId,
        employmentStatus: 'ACTIVE',
        ...(employeeIds?.length ? { id: { in: employeeIds } } : {}),
      },
      include: { wallet: true },
    });
    if (!employees.length)
      throw new ApiError('PAYROLL_EMPTY', 'No eligible active employees');
    if (employees.length > 20)
      throw new ApiError(
        'PAYROLL_BATCH_TOO_LARGE',
        'Maximum payroll batch is 20',
      );
    for (const e of employees)
      if (!e.wallet || !e.salaryCiphertext || !e.salaryTokenAddress)
        throw new ApiError(
          'EMPLOYEE_INCOMPLETE',
          'Every employee requires verified wallet and salary',
        );
    const token = getAddress(process.env.CONFIDENTIAL_TOKEN_ADDRESS!);
    if (employees.some((e) => getAddress(e.salaryTokenAddress!) !== token))
      throw new ApiError(
        'PAYROLL_TOKEN_MISMATCH',
        'All employees must use the configured confidential token',
      );
    const id = randomUUID();
    const onchainPayrollId = keccak256(
      stringToHex(`veilpay:${companyId}:${id}`),
    );
    const deadline = new Date(Date.now() + expiresInSeconds * 1000);
    const run = await this.prisma.payrollRun.create({
      data: {
        id,
        companyId,
        safeAccountId: safe.id,
        chainId: this.blockchain.chainId,
        tokenAddress: token,
        payrollContractAddress: getAddress(
          process.env.CONFIDENTIAL_PAYROLL_ADDRESS!,
        ),
        label,
        onchainPayrollId,
        itemCount: employees.length,
        deadline,
        createdById: userId,
        items: {
          create: employees.map((e, i) => ({
            employeeProfileId: e.id,
            itemIndex: i,
            recipientAddress: e.wallet!.address,
            salaryCiphertextSnapshot: e.salaryCiphertext!,
          })),
        },
      },
      include: { items: true },
    });
    await this.audit.record(
      userId,
      companyId,
      'PAYROLL_DRAFT_CREATED',
      'PayrollRun',
      run.id,
      { itemCount: run.itemCount },
    );
    return this.get(userId, companyId, run.id);
  }
  async list(userId: string, companyId: string, skip = 0, take = 20) {
    await this.companies.assertRole(userId, companyId);
    return this.prisma.payrollRun.findMany({
      where: { companyId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        status: true,
        itemCount: true,
        deadline: true,
        manifestHash: true,
        safeTxHash: true,
        executionTxHash: true,
        createdAt: true,
      },
    });
  }
  async get(userId: string, companyId: string, id: string) {
    await this.companies.assertRole(userId, companyId);
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        companyId: true,
        chainId: true,
        label: true,
        status: true,
        itemCount: true,
        tokenAddress: true,
        payrollContractAddress: true,
        onchainPayrollId: true,
        manifestHash: true,
        deadline: true,
        safeTxHash: true,
        executionTxHash: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            itemIndex: true,
            recipientAddress: true,
            encryptedHandle: true,
            status: true,
            txHash: true,
          },
        },
      },
    });
    if (!run)
      throw new ApiError(
        'PAYROLL_NOT_FOUND',
        'Payroll not found',
        HttpStatus.NOT_FOUND,
      );
    return run;
  }
  async updateDraft(
    userId: string,
    companyId: string,
    id: string,
    label?: string,
    employeeIds?: string[],
  ) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'HR',
    ]);
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, companyId, status: 'DRAFT' },
    });
    if (!run)
      throw new ApiError(
        'PAYROLL_INVALID_STATE',
        'Only DRAFT payrolls can be updated',
      );
    if (employeeIds) {
      const employees = await this.prisma.employeeProfile.findMany({
        where: {
          companyId,
          id: { in: employeeIds },
          employmentStatus: 'ACTIVE',
        },
        include: { wallet: true },
      });
      if (employees.length !== employeeIds.length || !employees.length)
        throw new ApiError(
          'PAYROLL_EMPLOYEE_SELECTION_INVALID',
          'All selected employees must be active',
        );
      for (const e of employees)
        if (!e.wallet || !e.salaryCiphertext || !e.salaryTokenAddress)
          throw new ApiError(
            'EMPLOYEE_INCOMPLETE',
            'Every employee requires verified wallet and salary',
          );
      await this.prisma.$transaction(async (tx) => {
        await tx.payrollItem.deleteMany({ where: { payrollRunId: id } });
        await tx.payrollItem.createMany({
          data: employees.map((e, i) => ({
            payrollRunId: id,
            employeeProfileId: e.id,
            itemIndex: i,
            recipientAddress: e.wallet!.address,
            salaryCiphertextSnapshot: e.salaryCiphertext!,
          })),
        });
        await tx.payrollRun.update({
          where: { id },
          data: {
            label,
            itemCount: employees.length,
            version: { increment: 1 },
          },
        });
      });
    } else if (label)
      await this.prisma.payrollRun.update({
        where: { id },
        data: { label, version: { increment: 1 } },
      });
    return this.get(userId, companyId, id);
  }
  async prepare(userId: string, companyId: string, id: string) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'HR',
    ]);
    const claimed = await this.prisma.payrollRun.updateMany({
      where: { id, companyId, status: 'DRAFT' },
      data: { status: 'PREPARING', version: { increment: 1 } },
    });
    if (claimed.count !== 1)
      throw new ApiError('PAYROLL_INVALID_STATE', 'Payroll must be DRAFT');
    try {
      const run = await this.prisma.payrollRun.findUniqueOrThrow({
        where: { id },
        include: {
          items: { orderBy: { itemIndex: 'asc' } },
          safeAccount: true,
        },
      });
      if (!run.safeAccount.address || !run.deadline)
        throw new ApiError(
          'PAYROLL_CONFIGURATION_INVALID',
          'Safe or deadline is missing',
        );
      const recipients = new Set<string>();
      const prepared = [] as {
        id: string;
        handle: Hex;
        proof: Hex;
        hash: Hex;
      }[];
      for (const item of run.items) {
        const recipient = getAddress(item.recipientAddress);
        if (recipients.has(recipient))
          throw new ApiError(
            'PAYROLL_DUPLICATE_RECIPIENT',
            'Duplicate payroll recipient',
          );
        recipients.add(recipient);
        const decimal = this.crypto.decrypt(
          item.salaryCiphertextSnapshot,
          companyId,
          item.employeeProfileId,
        );
        const amount = new Decimal(decimal).mul(new Decimal(10).pow(6));
        if (!amount.isInteger() || !amount.isPositive())
          throw new ApiError(
            'SALARY_INVALID',
            'Salary cannot be converted to token base units',
          );
        const input = await this.nox.encryptAmount(
          BigInt(amount.toFixed(0)),
          getAddress(run.payrollContractAddress),
        );
        prepared.push({
          id: item.id,
          handle: input.handle,
          proof: input.proof,
          hash: keccak256(input.handle),
        });
      }
      const deadline = BigInt(Math.floor(run.deadline.getTime() / 1000));
      const manifestHash = this.manifest.hash({
        chainId: run.chainId,
        payrollContract: getAddress(run.payrollContractAddress),
        token: getAddress(run.tokenAddress),
        treasury: getAddress(run.safeAccount.address),
        payrollId: run.onchainPayrollId as Hex,
        recipients: run.items.map((i) => getAddress(i.recipientAddress)),
        handles: prepared.map((i) => i.handle),
        deadline,
      });
      await this.prisma.$transaction(async (tx) => {
        for (const item of prepared)
          await tx.payrollItem.update({
            where: { id: item.id },
            data: {
              encryptedHandle: item.handle,
              inputProof: Buffer.from(item.proof.slice(2), 'hex'),
              handleHash: item.hash,
              status: 'PREPARED',
            },
          });
        await tx.payrollRun.update({
          where: { id },
          data: { status: 'PREPARED', manifestHash, preparedAt: new Date() },
        });
      });
      return this.get(userId, companyId, id);
    } catch (error) {
      await this.prisma.payrollRun.updateMany({
        where: { id, status: 'PREPARING' },
        data: { status: 'FAILED_RETRYABLE' },
      });
      throw error;
    }
  }
  async buildSafeTransaction(userId: string, companyId: string, id: string) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'HR',
      'FINANCE',
    ]);
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, companyId },
      include: { safeAccount: true },
    });
    if (!run)
      throw new ApiError(
        'PAYROLL_NOT_FOUND',
        'Payroll not found',
        HttpStatus.NOT_FOUND,
      );
    this.states.assert(run.status, 'PROPOSING');
    await this.prisma.payrollRun.update({
      where: { id },
      data: { status: 'PROPOSING' },
    });
    try {
      const built = await this.safe.buildPayrollTransaction(run);
      const json = JSON.parse(
        JSON.stringify(built.safeTx.data),
      ) as Prisma.InputJsonValue;
      await this.prisma.$transaction([
        this.prisma.safeTransactionProposal.upsert({
          where: { payrollRunId: id },
          update: { safeTxHash: built.safeTxHash, transactionJson: json },
          create: {
            payrollRunId: id,
            safeAddress: run.safeAccount.address!,
            safeTxHash: built.safeTxHash,
            transactionJson: json,
          },
        }),
        this.prisma.payrollRun.update({
          where: { id },
          data: { status: 'PREPARED', safeTxHash: built.safeTxHash },
        }),
      ]);
      return {
        safeAddress: run.safeAccount.address,
        safeTxHash: built.safeTxHash,
        transactionData: built.safeTx.data,
        calls: built.calls,
        signingMethod:
          'personal_sign safeTxHash (backend converts v for Safe ETH_SIGN)',
      };
    } catch (e) {
      await this.prisma.payrollRun.update({
        where: { id },
        data: { status: 'FAILED_RETRYABLE' },
      });
      throw e;
    }
  }
  async propose(
    userId: string,
    companyId: string,
    id: string,
    senderAddress: Address,
    signature: Hex,
  ) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'HR',
      'FINANCE',
    ]);
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, companyId },
      include: { proposal: true, safeAccount: true },
    });
    if (!run?.proposal || !run.safeTxHash || !run.safeAccount.address)
      throw new ApiError(
        'SAFE_TRANSACTION_NOT_BUILT',
        'Build Safe transaction first',
      );
    if (run.status !== 'PREPARED')
      throw new ApiError('PAYROLL_INVALID_STATE', 'Payroll must be PREPARED');
    await this.prisma.payrollRun.update({
      where: { id },
      data: { status: 'PROPOSING' },
    });
    try {
      const result = await this.safe.propose(
        getAddress(run.safeAccount.address),
        run.safeTxHash as Hex,
        run.proposal.transactionJson as unknown as SafeTransactionData,
        senderAddress,
        signature,
      );
      await this.prisma.$transaction([
        this.prisma.safeTransactionProposal.update({
          where: { id: run.proposal.id },
          data: {
            senderAddress: result.sender,
            senderSignature: result.serviceSignature,
            status: 'PROPOSED',
            confirmationsReceived: 1,
          },
        }),
        this.prisma.payrollRun.update({
          where: { id },
          data: { status: 'PROPOSED', proposedAt: new Date() },
        }),
      ]);
      return { status: 'PROPOSED', safeTxHash: run.safeTxHash };
    } catch (e) {
      await this.prisma.payrollRun.update({
        where: { id },
        data: { status: 'FAILED_RETRYABLE' },
      });
      throw e;
    }
  }
  async syncApproval(
    userId: string,
    companyId: string,
    id: string,
    safeExecutionTxHash: Hash,
  ) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'HR',
      'FINANCE',
    ]);
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, companyId },
      include: { safeAccount: true },
    });
    if (!run?.safeAccount.address || !run.manifestHash)
      throw new ApiError('PAYROLL_NOT_PREPARED', 'Payroll is incomplete');
    await this.blockchain.verifiedReceipt(safeExecutionTxHash);
    const approval = await this.blockchain.publicClient.readContract({
      address: getAddress(run.payrollContractAddress),
      abi: payrollAbi,
      functionName: 'getApproval',
      args: [getAddress(run.safeAccount.address), run.onchainPayrollId as Hex],
    });
    if (
      approval.status !== 1 ||
      approval.manifestHash.toLowerCase() !== run.manifestHash.toLowerCase() ||
      getAddress(approval.token) !== getAddress(run.tokenAddress) ||
      approval.itemCount !== run.itemCount
    )
      throw new ApiError(
        'PAYROLL_MANIFEST_MISMATCH',
        'On-chain approval does not match prepared payroll',
      );
    await this.prisma.$transaction([
      this.prisma.payrollRun.update({
        where: { id },
        data: {
          status: 'SAFE_APPROVED',
          safeExecutionTxHash,
          safeApprovedAt: new Date(),
        },
      }),
      this.prisma.safeTransactionProposal.update({
        where: { payrollRunId: id },
        data: {
          status: 'EXECUTED',
          onchainTxHash: safeExecutionTxHash,
          lastSyncedAt: new Date(),
        },
      }),
    ]);
    return { status: 'SAFE_APPROVED', approval };
  }
  async execute(userId: string, companyId: string, id: string) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'HR',
      'FINANCE',
    ]);
    const claimed = await this.prisma.payrollRun.updateMany({
      where: { id, companyId, status: 'SAFE_APPROVED' },
      data: { status: 'EXECUTING', version: { increment: 1 } },
    });
    if (claimed.count !== 1) {
      const existing = await this.prisma.payrollRun.findFirst({
        where: { id, companyId },
      });
      if (existing?.status === 'EXECUTED')
        return this.get(userId, companyId, id);
      throw new ApiError(
        'PAYROLL_INVALID_STATE',
        'Payroll must be SAFE_APPROVED',
      );
    }
    const run = await this.prisma.payrollRun.findUniqueOrThrow({
      where: { id },
      include: { items: { orderBy: { itemIndex: 'asc' } }, safeAccount: true },
    });
    try {
      if (!process.env.RELAYER_PRIVATE_KEY)
        throw new ApiError('RELAYER_UNAVAILABLE', 'Relayer is not configured');
      if (
        !run.safeAccount.address ||
        !run.deadline ||
        run.deadline <= new Date()
      )
        throw new ApiError('PAYROLL_EXPIRED', 'Payroll approval expired');
      const approval = await this.blockchain.publicClient.readContract({
        address: getAddress(run.payrollContractAddress),
        abi: payrollAbi,
        functionName: 'getApproval',
        args: [
          getAddress(run.safeAccount.address),
          run.onchainPayrollId as Hex,
        ],
      });
      if (approval.status === 3) {
        await this.prisma.payrollRun.update({
          where: { id },
          data: { status: 'EXECUTED', executedAt: new Date() },
        });
        return this.get(userId, companyId, id);
      }
      if (
        approval.status !== 1 ||
        approval.manifestHash.toLowerCase() !== run.manifestHash?.toLowerCase()
      )
        throw new ApiError(
          'PAYROLL_MANIFEST_MISMATCH',
          'Exact on-chain approval is missing',
        );
      const operator = await this.blockchain.publicClient.readContract({
        address: getAddress(run.tokenAddress),
        abi: tokenAbi,
        functionName: 'isOperator',
        args: [
          getAddress(run.safeAccount.address),
          getAddress(run.payrollContractAddress),
        ],
      });
      if (!operator)
        throw new ApiError(
          'PAYROLL_OPERATOR_PERMISSION_MISSING',
          'Bounded token operator permission is missing',
        );
      const account = privateKeyToAccount(
        process.env.RELAYER_PRIVATE_KEY as Hex,
      );
      const wallet = createWalletClient({
        account,
        chain: this.blockchain.chain,
        transport: http(process.env.WEB3_RPC_URL),
      });
      const args = [
        getAddress(run.safeAccount.address),
        run.onchainPayrollId as Hex,
        getAddress(run.tokenAddress),
        run.items.map((i) => getAddress(i.recipientAddress)),
        run.items.map((i) => i.encryptedHandle as Hex),
        run.items.map((i) => bytesToHex(i.inputProof!)),
        Math.floor(run.deadline.getTime() / 1000),
      ] as const;
      const { request } = await this.blockchain.publicClient.simulateContract({
        account,
        address: getAddress(run.payrollContractAddress),
        abi: payrollAbi,
        functionName: 'executePayroll',
        args,
      });
      const txHash = await wallet.writeContract(request);
      await this.prisma.blockchainTransaction.create({
        data: {
          companyId,
          relatedType: 'PayrollRun',
          relatedId: id,
          chainId: run.chainId,
          txHash,
          fromAddress: account.address,
          toAddress: run.payrollContractAddress,
          functionName: 'executePayroll',
        },
      });
      const receipt = await this.blockchain.verifiedReceipt(txHash);
      const event = receipt.logs.some((log) => {
        try {
          const decoded = decodeEventLog({
            abi: payrollAbi,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === 'PayrollExecuted';
        } catch {
          return false;
        }
      });
      const finalApproval = await this.blockchain.publicClient.readContract({
        address: getAddress(run.payrollContractAddress),
        abi: payrollAbi,
        functionName: 'getApproval',
        args: [
          getAddress(run.safeAccount.address),
          run.onchainPayrollId as Hex,
        ],
      });
      if (!event || finalApproval.status !== 3)
        throw new ApiError(
          'BLOCKCHAIN_STATE_UNVERIFIED',
          'Payroll execution final state could not be verified',
        );
      await this.prisma.$transaction([
        this.prisma.payrollRun.update({
          where: { id },
          data: {
            status: 'EXECUTED',
            executionTxHash: txHash,
            executedAt: new Date(),
          },
        }),
        this.prisma.payrollItem.updateMany({
          where: { payrollRunId: id },
          data: {
            status: 'CONFIRMED',
            txHash,
            blockNumber: receipt.blockNumber,
          },
        }),
        this.prisma.blockchainTransaction.update({
          where: { chainId_txHash: { chainId: run.chainId, txHash } },
          data: {
            status: 'FINALIZED',
            blockNumber: receipt.blockNumber,
            blockHash: receipt.blockHash,
            confirmations: Number(process.env.WEB3_CONFIRMATIONS ?? 2),
            minedAt: new Date(),
            finalizedAt: new Date(),
          },
        }),
      ]);
      await this.audit.record(
        userId,
        companyId,
        'PAYROLL_EXECUTED',
        'PayrollRun',
        id,
        { txHash },
      );
      return this.get(userId, companyId, id);
    } catch (e) {
      await this.prisma.payrollRun.updateMany({
        where: { id, status: 'EXECUTING' },
        data: { status: 'FAILED_RETRYABLE' },
      });
      throw e;
    }
  }
  async cancel(userId: string, companyId: string, id: string) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'HR',
    ]);
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, companyId },
      include: { safeAccount: true },
    });
    if (!run)
      throw new ApiError(
        'PAYROLL_NOT_FOUND',
        'Payroll not found',
        HttpStatus.NOT_FOUND,
      );
    if (run.status === 'DRAFT' || run.status === 'PREPARED') {
      await this.prisma.payrollRun.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });
      return { status: 'CANCELLED' };
    }
    if (
      !['PROPOSED', 'SAFE_APPROVED'].includes(run.status) ||
      !run.safeAccount.address
    )
      throw new ApiError(
        'PAYROLL_INVALID_STATE',
        'Payroll cannot be cancelled',
      );
    return {
      status: run.status,
      requiresSafeExecution: true,
      transaction: {
        to: run.payrollContractAddress,
        value: '0',
        data: encodeFunctionData({
          abi: payrollAbi,
          functionName: 'cancelPayroll',
          args: [run.onchainPayrollId as Hex],
        }),
      },
    };
  }
  async reconcile(userId: string, companyId: string, id: string) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'HR',
      'FINANCE',
    ]);
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, companyId },
      include: { safeAccount: true },
    });
    if (!run?.safeAccount.address)
      throw new ApiError('PAYROLL_NOT_FOUND', 'Payroll not found');
    const approval = await this.blockchain.publicClient.readContract({
      address: getAddress(run.payrollContractAddress),
      abi: payrollAbi,
      functionName: 'getApproval',
      args: [getAddress(run.safeAccount.address), run.onchainPayrollId as Hex],
    });
    const status =
      approval.status === 3
        ? 'EXECUTED'
        : approval.status === 4
          ? 'CANCELLED'
          : approval.status === 1
            ? 'SAFE_APPROVED'
            : run.status;
    if (status !== run.status)
      await this.prisma.payrollRun.update({ where: { id }, data: { status } });
    return { databaseStatus: status, onchainApproval: approval };
  }
}
