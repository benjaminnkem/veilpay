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
      confidentialTokenAddress:
        dto.confidentialTokenAddress !== undefined
          ? dto.confidentialTokenAddress
          : org.confidentialTokenAddress,
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

    const provider = org.executionProvider ?? 'mock';
    const hasSafe = Boolean(org.safeAddress && org.network);
    const hasNox = Boolean(
      org.confidentialTokenAddress &&
        org.network &&
        (provider === 'nox' || org.confidentialTokenAddress),
    );
    const configured = hasSafe || Boolean(org.confidentialTokenAddress);
    const ready =
      provider === 'nox'
        ? Boolean(org.confidentialTokenAddress && org.network)
        : hasSafe;

    return {
      safeAddress: org.safeAddress,
      network: org.network,
      executionProvider: provider,
      confidentialTokenAddress: org.confidentialTokenAddress ?? null,
      configured,
      ready,
      status: ready
        ? 'ready'
        : configured
          ? 'configured'
          : 'not_configured',
      message:
        provider === 'nox' && ready
          ? 'Confidential payroll is ready. Amounts settle as encrypted on-chain transfers.'
          : hasSafe
            ? 'Safe treasury linked. Use public multi-send, or enable Nox for confidential amounts.'
            : hasNox
              ? 'Confidential token configured. Enable Nox execution mode to use it.'
              : 'Connect a Safe and confidential token in organization settings.',
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
    confidentialTokenAddress: org.confidentialTokenAddress ?? null,
    currency: org.currency,
    timezone: org.timezone,
    logoUrl: org.logoUrl,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  };
}
