import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  ApprovalLevel,
  ApprovalStatus,
  AuditAction,
  NotificationType,
  UserRole,
} from '@repo/types';
import {
  ApprovalEntity,
  OrganizationSettingsEntity,
  PayrollEntity,
  UserEntity,
} from '../../database/entities';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';
import type { JwtPayloadUser } from '../../common/decorators/current-user.decorator';
import { requireOrganizationId } from '../../common/utils/org.util';
import { MailService } from '../../mail/mail.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PayrollService } from '../payroll/payroll.service';
import { ApprovalActionDto } from './dto/approval-action.dto';

const LEVEL_ROLE_MAP: Record<ApprovalLevel, UserRole[]> = {
  [ApprovalLevel.HR]: [UserRole.HR, UserRole.OWNER, UserRole.SUPER_ADMIN],
  [ApprovalLevel.FINANCE]: [
    UserRole.FINANCE,
    UserRole.OWNER,
    UserRole.SUPER_ADMIN,
  ],
  [ApprovalLevel.CEO]: [UserRole.CEO, UserRole.OWNER, UserRole.SUPER_ADMIN],
};

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(ApprovalEntity)
    private readonly approvalRepo: Repository<ApprovalEntity>,
    @InjectRepository(OrganizationSettingsEntity)
    private readonly settingsRepo: Repository<OrganizationSettingsEntity>,
    @InjectRepository(PayrollEntity)
    private readonly payrollRepo: Repository<PayrollEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly auditLogs: AuditLogsService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    @Inject(forwardRef(() => PayrollService))
    private readonly payrollService: PayrollService,
  ) {}

  async initializeForPayroll(payroll: PayrollEntity): Promise<void> {
    const settings = await this.settingsRepo.findOne({
      where: { organizationId: payroll.organizationId },
    });

    const sequence =
      settings?.defaultApprovalSequence?.length
        ? settings.defaultApprovalSequence
        : [ApprovalLevel.HR, ApprovalLevel.FINANCE, ApprovalLevel.CEO];

    const steps = sequence.map((level, index) =>
      this.approvalRepo.create({
        payrollId: payroll.id,
        organizationId: payroll.organizationId,
        level: level as ApprovalLevel,
        sequence: index + 1,
        status: ApprovalStatus.PENDING,
        approverId: null,
        comments: null,
        actedAt: null,
      }),
    );

    await this.approvalRepo.save(steps);

    await this.auditLogs.log({
      organizationId: payroll.organizationId,
      action: AuditAction.APPROVAL_CREATED,
      entityType: 'Payroll',
      entityId: payroll.id,
      metadata: { sequence },
    });

    const firstLevel = (sequence[0] ?? ApprovalLevel.HR) as ApprovalLevel;
    await this.notifyApproversForLevel(payroll, firstLevel);
  }

  async findPending(actor: JwtPayloadUser, query: PaginationDto) {
    const orgId = requireOrganizationId(actor);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    // Pending approvals where this role can act and previous steps approved
    const allPending = await this.approvalRepo.find({
      where: {
        organizationId: orgId,
        status: ApprovalStatus.PENDING,
      },
      relations: { payroll: true, approver: true },
      order: { sequence: 'ASC', createdAt: 'DESC' },
    });

    const actionable: ApprovalEntity[] = [];

    for (const step of allPending) {
      const canAct = this.roleCanAct(actor.role, step.level);
      if (!canAct) continue;

      const prior = await this.approvalRepo.find({
        where: { payrollId: step.payrollId },
        order: { sequence: 'ASC' },
      });

      const previousOk = prior
        .filter((s) => s.sequence < step.sequence)
        .every((s) => s.status === ApprovalStatus.APPROVED);

      const isCurrent =
        previousOk &&
        !prior.some(
          (s) =>
            s.sequence < step.sequence && s.status === ApprovalStatus.PENDING,
        );

      if (isCurrent || (previousOk && step.sequence === Math.min(...prior.filter(p => p.status === ApprovalStatus.PENDING).map(p => p.sequence)))) {
        actionable.push(step);
      }
    }

    // Dedupe by payroll, keep lowest sequence pending
    const byPayroll = new Map<string, ApprovalEntity>();
    for (const step of actionable) {
      const existing = byPayroll.get(step.payrollId);
      if (!existing || step.sequence < existing.sequence) {
        byPayroll.set(step.payrollId, step);
      }
    }

    const list = Array.from(byPayroll.values());
    const total = list.length;
    const slice = list.slice((page - 1) * pageSize, page * pageSize);

    return {
      data: slice.map((s) => this.serializeApprovalListItem(s)),
      meta: buildMeta(page, pageSize, total),
    };
  }

  async timeline(actor: JwtPayloadUser, payrollId: string) {
    const orgId = requireOrganizationId(actor);
    const steps = await this.approvalRepo.find({
      where: { payrollId, organizationId: orgId },
      relations: { approver: true },
      order: { sequence: 'ASC' },
    });

    if (!steps.length) {
      return {
        payrollId,
        currentLevel: null,
        overallStatus: 'NOT_STARTED' as const,
        steps: [],
      };
    }

    const rejected = steps.some((s) => s.status === ApprovalStatus.REJECTED);
    const allApproved = steps.every(
      (s) => s.status === ApprovalStatus.APPROVED,
    );
    const current = steps.find((s) => s.status === ApprovalStatus.PENDING);

    return {
      payrollId,
      currentLevel: current?.level ?? null,
      overallStatus: rejected
        ? ApprovalStatus.REJECTED
        : allApproved
          ? 'COMPLETED'
          : ApprovalStatus.PENDING,
      steps: steps.map((s) => this.serializeStep(s)),
    };
  }

  async approve(
    actor: JwtPayloadUser,
    approvalId: string,
    dto: ApprovalActionDto,
  ) {
    return this.act(actor, approvalId, ApprovalStatus.APPROVED, dto);
  }

  async reject(
    actor: JwtPayloadUser,
    approvalId: string,
    dto: ApprovalActionDto,
  ) {
    return this.act(actor, approvalId, ApprovalStatus.REJECTED, dto);
  }

  private async act(
    actor: JwtPayloadUser,
    approvalId: string,
    status: ApprovalStatus.APPROVED | ApprovalStatus.REJECTED,
    dto: ApprovalActionDto,
  ) {
    const orgId = requireOrganizationId(actor);
    const step = await this.approvalRepo.findOne({
      where: { id: approvalId, organizationId: orgId },
      relations: { approver: true },
    });
    if (!step) throw new NotFoundException('Approval step not found');

    if (step.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Approval step already processed');
    }

    if (!this.roleCanAct(actor.role, step.level)) {
      throw new ForbiddenException(
        `Role ${actor.role} cannot act on ${step.level} approval`,
      );
    }

    // Ensure prior steps approved
    const prior = await this.approvalRepo.find({
      where: { payrollId: step.payrollId },
      order: { sequence: 'ASC' },
    });
    const previousOk = prior
      .filter((s) => s.sequence < step.sequence)
      .every((s) => s.status === ApprovalStatus.APPROVED);
    if (!previousOk) {
      throw new BadRequestException('Previous approval steps incomplete');
    }

    step.status = status;
    step.approverId = actor.id;
    step.comments = dto.comments ?? null;
    step.actedAt = new Date();
    await this.approvalRepo.save(step);

    const action =
      status === ApprovalStatus.APPROVED
        ? AuditAction.APPROVAL_APPROVED
        : AuditAction.APPROVAL_REJECTED;

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action,
      entityType: 'Approval',
      entityId: step.id,
      metadata: { payrollId: step.payrollId, level: step.level },
    });

    const payroll = await this.payrollRepo.findOne({
      where: { id: step.payrollId },
    });

    if (status === ApprovalStatus.REJECTED) {
      await this.payrollService.markRejected(step.payrollId);
      if (payroll) {
        await this.auditLogs.log({
          organizationId: orgId,
          actorId: actor.id,
          actorEmail: actor.email,
          action: AuditAction.PAYROLL_REJECTED,
          entityType: 'Payroll',
          entityId: payroll.id,
        });
        await this.notifications.create({
          userId: payroll.createdById,
          organizationId: orgId,
          type: NotificationType.APPROVAL,
          title: 'Payroll rejected',
          body: `${payroll.name} was rejected at ${step.level}.`,
          link: `/payroll/${payroll.id}`,
        });

        const creator = await this.usersRepo.findOne({
          where: { id: payroll.createdById },
        });
        if (creator) {
          await this.mail.sendPayrollRejected({
            to: creator.email,
            firstName: creator.firstName,
            payrollName: payroll.name,
            payrollId: payroll.id,
            level: step.level,
            comments: dto.comments,
          });
        }
      }
    } else {
      const fresh = await this.approvalRepo.find({
        where: { payrollId: step.payrollId },
      });
      const allApproved = fresh.every(
        (s) => s.status === ApprovalStatus.APPROVED,
      );

      if (allApproved) {
        await this.payrollService.markApproved(step.payrollId);
        if (payroll) {
          await this.auditLogs.log({
            organizationId: orgId,
            actorId: actor.id,
            actorEmail: actor.email,
            action: AuditAction.PAYROLL_APPROVED,
            entityType: 'Payroll',
            entityId: payroll.id,
          });
          await this.notifications.create({
            userId: payroll.createdById,
            organizationId: orgId,
            type: NotificationType.SUCCESS,
            title: 'Payroll fully approved',
            body: `${payroll.name} is ready for execution.`,
            link: `/payroll/${payroll.id}`,
          });

          const creator = await this.usersRepo.findOne({
            where: { id: payroll.createdById },
          });
          if (creator) {
            await this.mail.sendPayrollApproved({
              to: creator.email,
              firstName: creator.firstName,
              payrollName: payroll.name,
              payrollId: payroll.id,
            });
          }
        }
      } else if (payroll) {
        await this.notifications.create({
          userId: payroll.createdById,
          organizationId: orgId,
          type: NotificationType.APPROVAL,
          title: `Approved at ${step.level}`,
          body: `${payroll.name} advanced in the approval chain.`,
          link: `/payroll/${payroll.id}`,
        });

        const nextStep = fresh
          .filter((s) => s.status === ApprovalStatus.PENDING)
          .sort((a, b) => a.sequence - b.sequence)[0];
        if (nextStep) {
          await this.notifyApproversForLevel(payroll, nextStep.level);
        }
      }
    }

    const updated = await this.approvalRepo.findOne({
      where: { id: step.id },
      relations: { approver: true },
    });
    return this.serializeStep(updated!);
  }

  private roleCanAct(role: UserRole, level: ApprovalLevel): boolean {
    if (role === UserRole.SUPER_ADMIN || role === UserRole.OWNER) return true;
    return LEVEL_ROLE_MAP[level]?.includes(role) ?? false;
  }

  private async notifyApproversForLevel(
    payroll: PayrollEntity,
    level: ApprovalLevel,
  ): Promise<void> {
    const roles = LEVEL_ROLE_MAP[level] ?? [];
    if (!roles.length) return;

    const users = await this.usersRepo.find({
      where: {
        organizationId: payroll.organizationId,
        isActive: true,
        role: In(roles),
      },
    });

    await Promise.all(
      users.map((user) =>
        this.mail.sendApprovalRequired({
          to: user.email,
          firstName: user.firstName,
          payrollName: payroll.name,
          payrollId: payroll.id,
          level,
        }),
      ),
    );
  }

  private serializeStep(s: ApprovalEntity) {
    return {
      id: s.id,
      payrollId: s.payrollId,
      organizationId: s.organizationId,
      level: s.level,
      sequence: s.sequence,
      status: s.status,
      approverId: s.approverId,
      approverName: s.approver
        ? `${s.approver.firstName} ${s.approver.lastName}`.trim()
        : null,
      comments: s.comments,
      actedAt: s.actedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  private serializeApprovalListItem(s: ApprovalEntity) {
    const payroll = s.payroll;
    return {
      id: s.id,
      title: payroll?.name ?? 'Payroll approval',
      requester: '-',
      type: 'payroll' as const,
      status: s.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
      createdAt: s.createdAt.toISOString(),
      summary: `${s.level} approval · sequence ${s.sequence}`,
      payrollId: s.payrollId,
      level: s.level,
      sequence: s.sequence,
      comments: s.comments,
    };
  }
}
