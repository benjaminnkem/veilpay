import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApprovalStatus,
  EmploymentStatus,
  PayrollStatus,
} from '@repo/types';
import {
  ApprovalEntity,
  AuditLogEntity,
  EmployeeEntity,
  OrganizationEntity,
  PayrollEntity,
} from '../../database/entities';
import type { JwtPayloadUser } from '../../common/decorators/current-user.decorator';
import { requireOrganizationId } from '../../common/utils/org.util';
import { centsToNumber } from '../../common/utils/money.util';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepo: Repository<EmployeeEntity>,
    @InjectRepository(PayrollEntity)
    private readonly payrollRepo: Repository<PayrollEntity>,
    @InjectRepository(ApprovalEntity)
    private readonly approvalsRepo: Repository<ApprovalEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly orgRepo: Repository<OrganizationEntity>,
  ) {}

  async getStats(actor: JwtPayloadUser) {
    const orgId = requireOrganizationId(actor);
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    const [
      totalEmployees,
      activeEmployees,
      pendingApprovals,
      draftPayrolls,
      approvedPayrolls,
      blockchainPendingPayrolls,
      payrollRows,
      departmentRows,
      recentLogs,
    ] = await Promise.all([
      this.employeesRepo.count({ where: { organizationId: orgId } }),
      this.employeesRepo.count({
        where: { organizationId: orgId, status: EmploymentStatus.ACTIVE },
      }),
      this.approvalsRepo.count({
        where: {
          organizationId: orgId,
          status: ApprovalStatus.PENDING,
        },
      }),
      this.payrollRepo.count({
        where: { organizationId: orgId, status: PayrollStatus.DRAFT },
      }),
      this.payrollRepo.count({
        where: { organizationId: orgId, status: PayrollStatus.APPROVED },
      }),
      this.payrollRepo.count({
        where: {
          organizationId: orgId,
          status: PayrollStatus.BLOCKCHAIN_PENDING,
        },
      }),
      this.payrollRepo.find({
        where: { organizationId: orgId },
        order: { createdAt: 'DESC' },
        take: 100,
      }),
      this.employeesRepo
        .createQueryBuilder('e')
        .select('COALESCE(e.department, \'Unassigned\')', 'department')
        .addSelect('COUNT(*)', 'employeeCount')
        .where('e.organizationId = :orgId', { orgId })
        .groupBy('e.department')
        .orderBy('employeeCount', 'DESC')
        .getRawMany<{ department: string; employeeCount: string }>(),
      this.auditRepo.find({
        where: { organizationId: orgId },
        order: { createdAt: 'DESC' },
        take: 12,
      }),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);

    const monthlyPayrollCents = payrollRows
      .filter(
        (p) =>
          p.payDate >= monthStart &&
          p.payDate <= monthEnd &&
          [
            PayrollStatus.APPROVED,
            PayrollStatus.BLOCKCHAIN_PENDING,
            PayrollStatus.COMPLETED,
            PayrollStatus.PROCESSING,
          ].includes(p.status),
      )
      .reduce((sum, p) => sum + centsToNumber(p.totalNetPayCents), 0);

    const upcoming =
      payrollRows
        .filter(
          (p) =>
            p.payDate >= now.toISOString().slice(0, 10) &&
            ![PayrollStatus.CANCELLED, PayrollStatus.REJECTED].includes(
              p.status,
            ),
        )
        .sort((a, b) => a.payDate.localeCompare(b.payDate))[0] ?? null;

    const payrollByStatus: Record<string, number> = {};
    for (const p of payrollRows) {
      payrollByStatus[p.status] = (payrollByStatus[p.status] ?? 0) + 1;
    }

    const trendMap = new Map<string, { total: number; count: number }>();
    for (const p of payrollRows) {
      const month = p.payDate.slice(0, 7);
      const entry = trendMap.get(month) ?? { total: 0, count: 0 };
      entry.total += centsToNumber(p.totalNetPayCents);
      entry.count += 1;
      trendMap.set(month, entry);
    }
    const payrollTrend = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, v]) => ({
        month,
        totalNetPayCents: v.total,
        runCount: v.count,
      }));

    const provider = org.executionProvider ?? 'mock';
    const configured = Boolean(
      (org.safeAddress && org.network) ||
        (org.confidentialTokenAddress && org.network),
    );
    const ready =
      provider === 'nox'
        ? Boolean(org.confidentialTokenAddress && org.network)
        : provider === 'blockchain'
          ? Boolean(org.safeAddress && org.network)
          : configured;

    return {
      totalEmployees,
      activeEmployees,
      monthlyPayrollCents,
      pendingApprovals,
      draftPayrolls,
      approvedPayrolls,
      blockchainPendingPayrolls,
      upcomingPayroll: upcoming
        ? {
            id: upcoming.id,
            name: upcoming.name,
            payDate: upcoming.payDate,
            status: upcoming.status,
            totalNetPayCents: centsToNumber(upcoming.totalNetPayCents),
            currency: upcoming.currency,
          }
        : null,
      treasury: {
        safeAddress: org.safeAddress,
        network: org.network,
        executionProvider: provider,
        confidentialTokenAddress: org.confidentialTokenAddress ?? null,
        ready,
        status: ready
          ? 'ready'
          : configured
            ? 'configured'
            : 'not_configured',
        message:
          provider === 'nox' && ready
            ? 'Nox confidential token linked. Payroll amounts settle as encrypted ERC-7984 transfers on Sepolia.'
            : provider === 'blockchain' && ready
              ? 'Safe treasury ready for public USDC multi-send. Switch to Nox for confidential amounts.'
              : configured
                ? 'Treasury partially configured. Finish Safe and/or Nox cToken setup in settings.'
                : 'Add Safe treasury and/or Nox confidential token in organization settings.',
      },
      payrollByStatus,
      departmentBreakdown: departmentRows.map((r) => ({
        department: r.department,
        employeeCount: Number(r.employeeCount),
      })),
      recentActivity: recentLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        actorEmail: log.actorEmail,
        createdAt: log.createdAt.toISOString(),
      })),
      payrollTrend,
    };
  }
}
