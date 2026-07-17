import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction } from '@repo/types';
import { OrganizationEntity } from '../../database/entities';
import type { JwtPayloadUser } from '../../common/decorators/current-user.decorator';
import { requireOrganizationId } from '../../common/utils/org.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly orgRepo: Repository<OrganizationEntity>,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async getMine(actor: JwtPayloadUser) {
    const orgId = requireOrganizationId(actor);
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    return serializeOrg(org);
  }

  async updateMine(actor: JwtPayloadUser, dto: UpdateOrganizationDto) {
    const orgId = requireOrganizationId(actor);
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    Object.assign(org, {
      name: dto.name ?? org.name,
      legalName: dto.legalName !== undefined ? dto.legalName : org.legalName,
      taxId: dto.taxId !== undefined ? dto.taxId : org.taxId,
      status: dto.status ?? org.status,
      safeAddress:
        dto.safeAddress !== undefined ? dto.safeAddress : org.safeAddress,
      network: dto.network !== undefined ? dto.network : org.network,
      executionProvider:
        dto.executionProvider !== undefined
          ? dto.executionProvider
          : org.executionProvider,
      currency: dto.currency ?? org.currency,
      timezone: dto.timezone ?? org.timezone,
      logoUrl: dto.logoUrl !== undefined ? dto.logoUrl : org.logoUrl,
    });

    await this.orgRepo.save(org);

    await this.auditLogs.log({
      organizationId: org.id,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.ORGANIZATION_UPDATED,
      entityType: 'Organization',
      entityId: org.id,
      metadata: { fields: Object.keys(dto) },
    });

    return serializeOrg(org);
  }

  async getTreasury(actor: JwtPayloadUser) {
    const orgId = requireOrganizationId(actor);
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    const configured = Boolean(org.safeAddress && org.network);
    const ready = configured;

    return {
      safeAddress: org.safeAddress,
      network: org.network,
      executionProvider: org.executionProvider ?? 'mock',
      configured,
      ready,
      status: ready
        ? 'ready'
        : configured
          ? 'configured'
          : 'not_configured',
      message: ready
        ? 'Safe treasury linked. Blockchain execution can use this Safe for USDC payroll.'
        : 'Connect a Safe treasury in organization settings to enable on-chain payroll.',
    };
  }
}

function serializeOrg(org: OrganizationEntity) {
  return {
    id: org.id,
    name: org.name,
    legalName: org.legalName,
    taxId: org.taxId,
    status: org.status,
    safeAddress: org.safeAddress,
    network: org.network,
    executionProvider: org.executionProvider ?? 'mock',
    currency: org.currency,
    timezone: org.timezone,
    logoUrl: org.logoUrl,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  };
}
