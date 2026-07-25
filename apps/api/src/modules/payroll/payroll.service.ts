import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  AuditAction,
  EmploymentStatus,
  NotificationType,
  PayrollStatus,
} from '@repo/types';
import {
  EmployeeEntity,
  OrganizationEntity,
  PayrollEntity,
  PayrollItemEntity,
} from '../../database/entities';
import { buildMeta } from '../../common/dto/pagination.dto';
import type { JwtPayloadUser } from '../../common/decorators/current-user.decorator';
import { requireOrganizationId } from '../../common/utils/org.util';
import {
  centsToNumber,
  numberToCentsString,
} from '../../common/utils/money.util';
import { MailService } from '../../mail/mail.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CompensationService } from '../compensation/compensation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { PaymentExecutionService } from './providers/payment-execution.service';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { UpdatePayrollItemDto } from './dto/update-payroll-item.dto';
import { PayrollQueryDto } from './dto/payroll-query.dto';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PayrollEntity)
    private readonly payrollRepo: Repository<PayrollEntity>,
    @InjectRepository(PayrollItemEntity)
    private readonly itemsRepo: Repository<PayrollItemEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepo: Repository<EmployeeEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly orgRepo: Repository<OrganizationEntity>,
    private readonly compensationService: CompensationService,
    @Inject(forwardRef(() => ApprovalsService))
    private readonly approvalsService: ApprovalsService,
    private readonly auditLogs: AuditLogsService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    private readonly paymentExecution: PaymentExecutionService,
  ) {}

  async create(actor: JwtPayloadUser, dto: CreatePayrollDto) {
    const orgId = requireOrganizationId(actor);

    const payroll = this.payrollRepo.create({
      organizationId: orgId,
      name: dto.name,
      periodStart: dto.periodStart,
      periodEnd: dto.periodEnd,
      payDate: dto.payDate,
      status: PayrollStatus.DRAFT,
      currency: dto.currency ?? 'USD',
      notes: dto.notes ?? null,
      createdById: actor.id,
      employeeCount: 0,
      totalBaseSalaryCents: '0',
      totalBonusCents: '0',
      totalAllowanceCents: '0',
      totalDeductionsCents: '0',
      totalNetPayCents: '0',
    });

    await this.payrollRepo.save(payroll);

    await this.generateItems(payroll, dto.employeeIds);

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.PAYROLL_CREATED,
      entityType: 'Payroll',
      entityId: payroll.id,
      metadata: { name: dto.name },
    });

    return this.findOne(actor, payroll.id);
  }

  async findAll(actor: JwtPayloadUser, query: PayrollQueryDto) {
    const orgId = requireOrganizationId(actor);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const qb = this.payrollRepo
      .createQueryBuilder('p')
      .where('p.organizationId = :orgId', { orgId })
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (query.status) {
      qb.andWhere('p.status = :status', { status: query.status });
    }
    if (query.search) {
      qb.andWhere('p.name ILIKE :s', { s: `%${query.search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data: data.map((p) => serializePayroll(p)),
      meta: buildMeta(page, pageSize, total),
    };
  }

  async findOne(actor: JwtPayloadUser, id: string) {
    const orgId = requireOrganizationId(actor);
    const payroll = await this.payrollRepo.findOne({
      where: { id, organizationId: orgId },
      relations: { items: true },
    });
    if (!payroll) throw new NotFoundException('Payroll not found');
    return serializePayroll(payroll, true);
  }

  async update(actor: JwtPayloadUser, id: string, dto: UpdatePayrollDto) {
    const orgId = requireOrganizationId(actor);
    const payroll = await this.payrollRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!payroll) throw new NotFoundException('Payroll not found');
    this.assertDraft(payroll);

    Object.assign(payroll, {
      name: dto.name ?? payroll.name,
      periodStart: dto.periodStart ?? payroll.periodStart,
      periodEnd: dto.periodEnd ?? payroll.periodEnd,
      payDate: dto.payDate ?? payroll.payDate,
      notes: dto.notes !== undefined ? dto.notes : payroll.notes,
    });

    await this.payrollRepo.save(payroll);

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.PAYROLL_UPDATED,
      entityType: 'Payroll',
      entityId: payroll.id,
    });

    return this.findOne(actor, id);
  }

  async regenerate(actor: JwtPayloadUser, id: string, employeeIds?: string[]) {
    const orgId = requireOrganizationId(actor);
    const payroll = await this.payrollRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!payroll) throw new NotFoundException('Payroll not found');
    this.assertDraft(payroll);

    await this.itemsRepo.delete({ payrollId: payroll.id });
    await this.generateItems(payroll, employeeIds);

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.PAYROLL_GENERATED,
      entityType: 'Payroll',
      entityId: payroll.id,
    });

    return this.findOne(actor, id);
  }

  async updateItem(
    actor: JwtPayloadUser,
    payrollId: string,
    itemId: string,
    dto: UpdatePayrollItemDto,
  ) {
    const orgId = requireOrganizationId(actor);
    const payroll = await this.payrollRepo.findOne({
      where: { id: payrollId, organizationId: orgId },
    });
    if (!payroll) throw new NotFoundException('Payroll not found');
    this.assertDraft(payroll);

    const item = await this.itemsRepo.findOne({
      where: { id: itemId, payrollId },
    });
    if (!item) throw new NotFoundException('Payroll item not found');

    if (dto.bonusCents !== undefined) {
      item.bonusCents = numberToCentsString(dto.bonusCents);
    }
    if (dto.allowanceCents !== undefined) {
      item.allowanceCents = numberToCentsString(dto.allowanceCents);
    }
    if (dto.deductionsCents !== undefined) {
      item.deductionsCents = numberToCentsString(dto.deductionsCents);
    }
    if (dto.notes !== undefined) item.notes = dto.notes;

    item.netPayCents = numberToCentsString(
      centsToNumber(item.baseSalaryCents) +
        centsToNumber(item.bonusCents) +
        centsToNumber(item.allowanceCents) -
        centsToNumber(item.deductionsCents),
    );

    await this.itemsRepo.save(item);
    await this.recalculateTotals(payroll);

    return serializeItem(item);
  }

  async preview(actor: JwtPayloadUser, id: string) {
    return this.findOne(actor, id);
  }

  async submit(actor: JwtPayloadUser, id: string) {
    const orgId = requireOrganizationId(actor);
    const payroll = await this.payrollRepo.findOne({
      where: { id, organizationId: orgId },
      relations: { items: true },
    });
    if (!payroll) throw new NotFoundException('Payroll not found');
    this.assertDraft(payroll);

    if (!payroll.items?.length) {
      throw new BadRequestException('Cannot submit payroll with no items');
    }

    await this.syncItemWalletsFromEmployees(payroll);

    const readiness = computePayoutReadiness(payroll.items ?? []);
    if (readiness.payableCount === 0) {
      throw new BadRequestException(
        'Cannot submit payroll with no payable amounts. At least one employee must have positive net pay.',
      );
    }

    payroll.status = PayrollStatus.PENDING_APPROVAL;
    payroll.submittedAt = new Date();
    await this.payrollRepo.save(payroll);

    await this.approvalsService.initializeForPayroll(payroll);

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.PAYROLL_SUBMITTED,
      entityType: 'Payroll',
      entityId: payroll.id,
    });

    await this.notifications.create({
      userId: actor.id,
      organizationId: orgId,
      type: NotificationType.PAYROLL,
      title: 'Payroll submitted for approval',
      body: `${payroll.name} is awaiting approval.`,
      link: `/payroll/${payroll.id}`,
    });

    await this.mail.sendPayrollSubmitted({
      to: actor.email,
      firstName: actor.firstName,
      payrollName: payroll.name,
      payrollId: payroll.id,
      employeeCount: payroll.employeeCount,
    });

    return this.findOne(actor, id);
  }

  async execute(actor: JwtPayloadUser, id: string) {
    const orgId = requireOrganizationId(actor);
    const payroll = await this.payrollRepo.findOne({
      where: { id, organizationId: orgId },
      relations: { items: true },
    });
    if (!payroll) throw new NotFoundException('Payroll not found');

    if (payroll.status !== PayrollStatus.APPROVED) {
      throw new BadRequestException(
        'Payroll must be fully approved before execution',
      );
    }

    await this.syncItemWalletsFromEmployees(payroll);

    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    const providerKind = org?.executionProvider ?? 'mock';
    const readiness = computePayoutReadiness(payroll.items ?? []);

    if (readiness.payableCount === 0) {
      throw new BadRequestException(
        'No payable amounts to execute. Every line item has zero net pay.',
      );
    }

    if (providerKind === 'blockchain' || providerKind === 'nox') {
      if (providerKind === 'blockchain' && (!org?.safeAddress || !org?.network)) {
        throw new BadRequestException(
          'Link a Safe treasury and network in Organization settings before blockchain execution.',
        );
      }
      if (providerKind === 'nox') {
        if (!org?.confidentialTokenAddress || !org?.network) {
          throw new BadRequestException(
            'Configure a confidential token and network in Organization settings before confidential execution.',
          );
        }
        if (!org?.safeAddress) {
          throw new BadRequestException(
            'Link the organization Safe treasury. Nox wraps USDC held by the Safe and pays from the Safe (MetaMask is only the owner signer).',
          );
        }
      }
      if (readiness.missingWalletCount > 0) {
        const names = readiness.missingWalletNames.slice(0, 8).join(', ');
        const more =
          readiness.missingWalletCount > 8
            ? ` (+${readiness.missingWalletCount - 8} more)`
            : '';
        throw new BadRequestException(
          `${readiness.missingWalletCount} of ${readiness.payableCount} payable employee(s) still need a payout wallet: ${names}${more}. They can link one under Settings → Payout wallet, then re-run execute.`,
        );
      }
    }

    payroll.status = PayrollStatus.PROCESSING;
    await this.payrollRepo.save(payroll);

    try {
      const result = await this.paymentExecution.executePayroll(
        {
          payrollId: payroll.id,
          organizationId: orgId,
          currency: payroll.currency,
          safeAddress: org?.safeAddress,
          network: org?.network,
          confidentialTokenAddress: org?.confidentialTokenAddress,
          items: (payroll.items ?? []).map((item) => ({
            employeeId: item.employeeId,
            employeeName: item.employeeName,
            amountCents: centsToNumber(item.netPayCents),
            currency: item.currency,
            walletAddress: item.walletAddress,
          })),
        },
        providerKind,
      );

      if (!result.success || result.status === 'FAILED') {
        payroll.status = PayrollStatus.FAILED;
        payroll.executionProvider = result.provider;
        payroll.executionMessage =
          result.message ?? 'Payment provider reported failure';
        await this.payrollRepo.save(payroll);
        throw new BadRequestException(
          result.message ?? 'Payment provider reported failure',
        );
      }

      if (result.status === 'BLOCKCHAIN_PENDING') {
        payroll.status = PayrollStatus.BLOCKCHAIN_PENDING;
        payroll.executedAt = new Date();
        payroll.transactionHash = result.transactionHash;
        payroll.network = org?.network ?? null;
        payroll.executionProvider = result.provider;
        payroll.executionMessage =
          result.message ??
          'Blockchain integration will be completed using Safe SDK and Nox Protocol.';
      } else {
        payroll.status = PayrollStatus.COMPLETED;
        payroll.executedAt = new Date();
        payroll.transactionHash = result.transactionHash;
        payroll.network = org?.network ?? null;
        payroll.executionProvider = result.provider;
        payroll.executionMessage = result.message;
      }

      await this.payrollRepo.save(payroll);

      await this.auditLogs.log({
        organizationId: orgId,
        actorId: actor.id,
        actorEmail: actor.email,
        action: AuditAction.PAYROLL_EXECUTED,
        entityType: 'Payroll',
        entityId: payroll.id,
        metadata: {
          provider: result.provider,
          status: result.status,
          externalReference: result.externalReference,
          message: result.message,
        },
      });

      await this.notifications.create({
        userId: actor.id,
        organizationId: orgId,
        type: NotificationType.PAYROLL,
        title:
          result.status === 'BLOCKCHAIN_PENDING'
            ? 'Payroll ready for blockchain'
            : 'Payroll executed',
        body:
          result.message ??
          `${payroll.name} execution finished with status ${result.status}.`,
        link: `/payroll/${payroll.id}`,
      });

      return this.findOne(actor, id);
    } catch (err) {
      if (payroll.status === PayrollStatus.PROCESSING) {
        payroll.status = PayrollStatus.FAILED;
        await this.payrollRepo.save(payroll);
      }
      throw err;
    }
  }

  async cancel(actor: JwtPayloadUser, id: string) {
    const orgId = requireOrganizationId(actor);
    const payroll = await this.payrollRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!payroll) throw new NotFoundException('Payroll not found');

    if (
      [
        PayrollStatus.COMPLETED,
        PayrollStatus.PROCESSING,
        PayrollStatus.BLOCKCHAIN_PENDING,
      ].includes(payroll.status)
    ) {
      throw new BadRequestException('Cannot cancel payroll in current status');
    }

    payroll.status = PayrollStatus.CANCELLED;
    await this.payrollRepo.save(payroll);

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.PAYROLL_CANCELLED,
      entityType: 'Payroll',
      entityId: payroll.id,
    });

    return this.findOne(actor, id);
  }

  /** Called by ApprovalsService when final approval completes */
  async markApproved(payrollId: string): Promise<void> {
    await this.payrollRepo.update(
      { id: payrollId },
      { status: PayrollStatus.APPROVED, approvedAt: new Date() },
    );
  }

  async markRejected(payrollId: string): Promise<void> {
    await this.payrollRepo.update(
      { id: payrollId },
      {
        status: PayrollStatus.REJECTED,
        submittedAt: null,
      },
    );
  }

  private async generateItems(
    payroll: PayrollEntity,
    employeeIds?: string[],
  ): Promise<void> {
    const where: {
      organizationId: string;
      status: EmploymentStatus;
      id?: ReturnType<typeof In>;
    } = {
      organizationId: payroll.organizationId,
      status: EmploymentStatus.ACTIVE,
    };

    const employees = await this.employeesRepo.find({
      where: employeeIds?.length
        ? {
            organizationId: payroll.organizationId,
            status: EmploymentStatus.ACTIVE,
            id: In(employeeIds),
          }
        : where,
    });

    const compMap = await this.compensationService.getCurrentCompMap(
      payroll.organizationId,
      employees.map((e) => e.id),
    );

    const items: PayrollItemEntity[] = employees.map((emp) => {
      const comp = compMap.get(emp.id) ?? {
        salary: 0,
        bonus: 0,
        allowance: 0,
        deduction: 0,
        currency: payroll.currency,
      };
      const base = comp.salary;
      const bonus = comp.bonus;
      const allowance = comp.allowance;
      const deductions = comp.deduction;
      const net = base + bonus + allowance - deductions;

      return this.itemsRepo.create({
        payrollId: payroll.id,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
        baseSalaryCents: numberToCentsString(base),
        bonusCents: numberToCentsString(bonus),
        allowanceCents: numberToCentsString(allowance),
        deductionsCents: numberToCentsString(deductions),
        netPayCents: numberToCentsString(net),
        currency: comp.currency || payroll.currency,
        walletAddress: emp.walletAddress,
        notes: null,
      });
    });

    if (items.length) {
      await this.itemsRepo.save(items);
    }

    await this.recalculateTotals(payroll);
  }

  private async recalculateTotals(payroll: PayrollEntity): Promise<void> {
    const items = await this.itemsRepo.find({
      where: { payrollId: payroll.id },
    });

    let totalBase = 0;
    let totalBonus = 0;
    let totalAllowance = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const item of items) {
      totalBase += centsToNumber(item.baseSalaryCents);
      totalBonus += centsToNumber(item.bonusCents);
      totalAllowance += centsToNumber(item.allowanceCents);
      totalDeductions += centsToNumber(item.deductionsCents);
      totalNet += centsToNumber(item.netPayCents);
    }

    payroll.employeeCount = items.length;
    payroll.totalBaseSalaryCents = numberToCentsString(totalBase);
    payroll.totalBonusCents = numberToCentsString(totalBonus);
    payroll.totalAllowanceCents = numberToCentsString(totalAllowance);
    payroll.totalDeductionsCents = numberToCentsString(totalDeductions);
    payroll.totalNetPayCents = numberToCentsString(totalNet);

    await this.payrollRepo.save(payroll);
  }

  private async syncItemWalletsFromEmployees(
    payroll: PayrollEntity,
  ): Promise<void> {
    const items = payroll.items ?? [];
    if (!items.length) return;

    const employees = await this.employeesRepo.find({
      where: {
        organizationId: payroll.organizationId,
        id: In(items.map((item) => item.employeeId)),
      },
    });
    const walletByEmployee = new Map(
      employees.map((emp) => [emp.id, emp.walletAddress ?? null]),
    );

    const dirty: PayrollItemEntity[] = [];
    for (const item of items) {
      const latest = walletByEmployee.get(item.employeeId) ?? null;
      if ((item.walletAddress ?? null) !== latest) {
        item.walletAddress = latest;
        dirty.push(item);
      }
    }

    if (dirty.length) {
      await this.itemsRepo.save(dirty);
    }
  }

  private assertDraft(payroll: PayrollEntity): void {
    if (
      payroll.status !== PayrollStatus.DRAFT &&
      payroll.status !== PayrollStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Only draft or rejected payrolls can be modified',
      );
    }
    if (payroll.status === PayrollStatus.REJECTED) {
      payroll.status = PayrollStatus.DRAFT;
    }
  }
}

function computePayoutReadiness(items: PayrollItemEntity[]) {
  let zeroPayCount = 0;
  let readyCount = 0;
  let missingWalletCount = 0;
  let payableNetPayCents = 0;
  const readyEmployeeNames: string[] = [];
  const missingWalletNames: string[] = [];

  for (const item of items) {
    const net = centsToNumber(item.netPayCents);
    if (net <= 0) {
      zeroPayCount += 1;
      continue;
    }
    payableNetPayCents += net;
    if (item.walletAddress) {
      readyCount += 1;
      readyEmployeeNames.push(item.employeeName);
    } else {
      missingWalletCount += 1;
      missingWalletNames.push(item.employeeName);
    }
  }

  return {
    itemCount: items.length,
    zeroPayCount,
    payableCount: readyCount + missingWalletCount,
    readyCount,
    missingWalletCount,
    payableNetPayCents,
    readyEmployeeNames,
    missingWalletNames,
  };
}

function serializeItem(item: PayrollItemEntity) {
  return {
    id: item.id,
    payrollId: item.payrollId,
    employeeId: item.employeeId,
    employeeName: item.employeeName,
    baseSalaryCents: centsToNumber(item.baseSalaryCents),
    bonusCents: centsToNumber(item.bonusCents),
    allowanceCents: centsToNumber(item.allowanceCents),
    deductionsCents: centsToNumber(item.deductionsCents),
    netPayCents: centsToNumber(item.netPayCents),
    currency: item.currency,
    walletAddress: item.walletAddress,
    transactionHash: item.transactionHash,
    notes: item.notes,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function serializePayroll(p: PayrollEntity, withItems = false) {
  const items = withItems && p.items ? p.items.map(serializeItem) : undefined;
  return {
    id: p.id,
    organizationId: p.organizationId,
    name: p.name,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    payDate: p.payDate,
    status: p.status,
    employeeCount: p.employeeCount,
    totalBaseSalaryCents: centsToNumber(p.totalBaseSalaryCents),
    totalBonusCents: centsToNumber(p.totalBonusCents),
    totalAllowanceCents: centsToNumber(p.totalAllowanceCents),
    totalDeductionsCents: centsToNumber(p.totalDeductionsCents),
    totalNetPayCents: centsToNumber(p.totalNetPayCents),
    totalAmount: centsToNumber(p.totalNetPayCents) / 100,
    periodLabel: `${p.periodStart} → ${p.periodEnd}`,
    scheduledAt: p.payDate,
    confidential: true,
    currency: p.currency,
    notes: p.notes,
    submittedAt: p.submittedAt?.toISOString() ?? null,
    approvedAt: p.approvedAt?.toISOString() ?? null,
    executedAt: p.executedAt?.toISOString() ?? null,
    transactionHash: p.transactionHash,
    network: p.network,
    executionProvider: p.executionProvider,
    executionMessage: p.executionMessage,
    createdById: p.createdById,
    items,
    payoutReadiness:
      withItems && p.items ? computePayoutReadiness(p.items) : undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
