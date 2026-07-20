import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction } from '@repo/types';
import { OrganizationSettingsEntity } from '../../database/entities';
import type { JwtPayloadUser } from '../../common/decorators/current-user.decorator';
import { requireOrganizationId } from '../../common/utils/org.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(OrganizationSettingsEntity)
    private readonly settingsRepo: Repository<OrganizationSettingsEntity>,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async get(actor: JwtPayloadUser) {
    const orgId = requireOrganizationId(actor);
    let settings = await this.settingsRepo.findOne({
      where: { organizationId: orgId },
    });

    if (!settings) {
      settings = this.settingsRepo.create({
        organizationId: orgId,
        payrollApprovalRequired: true,
        defaultApprovalSequence: ['HR', 'FINANCE', 'CEO'],
        autoGeneratePayrollItems: true,
        notificationEmailEnabled: false,
        fiscalYearStartMonth: 1,
      });
      await this.settingsRepo.save(settings);
    }

    return serializeSettings(settings);
  }

  async update(actor: JwtPayloadUser, dto: UpdateSettingsDto) {
    const orgId = requireOrganizationId(actor);
    let settings = await this.settingsRepo.findOne({
      where: { organizationId: orgId },
    });

    if (!settings) {
      settings = this.settingsRepo.create({
        organizationId: orgId,
        payrollApprovalRequired: true,
        defaultApprovalSequence: ['HR', 'FINANCE', 'CEO'],
        autoGeneratePayrollItems: true,
        notificationEmailEnabled: false,
        fiscalYearStartMonth: 1,
      });
    }

    Object.assign(settings, {
      payrollApprovalRequired:
        dto.payrollApprovalRequired ?? settings.payrollApprovalRequired,
      defaultApprovalSequence:
        dto.defaultApprovalSequence ?? settings.defaultApprovalSequence,
      autoGeneratePayrollItems:
        dto.autoGeneratePayrollItems ?? settings.autoGeneratePayrollItems,
      notificationEmailEnabled:
        dto.notificationEmailEnabled ?? settings.notificationEmailEnabled,
      fiscalYearStartMonth:
        dto.fiscalYearStartMonth ?? settings.fiscalYearStartMonth,
    });

    await this.settingsRepo.save(settings);

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.SETTINGS_UPDATED,
      entityType: 'OrganizationSettings',
      entityId: settings.id,
      metadata: { fields: Object.keys(dto) },
    });

    return serializeSettings(settings);
  }
}

function serializeSettings(s: OrganizationSettingsEntity) {
  return {
    id: s.id,
    organizationId: s.organizationId,
    payrollApprovalRequired: s.payrollApprovalRequired,
    defaultApprovalSequence: s.defaultApprovalSequence,
    autoGeneratePayrollItems: s.autoGeneratePayrollItems,
    notificationEmailEnabled: s.notificationEmailEnabled,
    fiscalYearStartMonth: s.fiscalYearStartMonth,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}
