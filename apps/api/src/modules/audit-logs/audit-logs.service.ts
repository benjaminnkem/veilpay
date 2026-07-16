import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../../database/entities';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';

export interface CreateAuditLogInput {
  organizationId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
  ) {}

  async log(input: CreateAuditLogInput): Promise<AuditLogEntity> {
    const entry = this.auditRepo.create({
      organizationId: input.organizationId ?? null,
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
    return this.auditRepo.save(entry);
  }

  async findAll(
    organizationId: string | null,
    query: PaginationDto & {
      action?: string;
      entityType?: string;
      actorId?: string;
      from?: string;
      to?: string;
    },
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const qb = this.auditRepo
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (organizationId) {
      qb.andWhere('a.organizationId = :organizationId', { organizationId });
    }

    if (query.action) {
      qb.andWhere('a.action = :action', { action: query.action });
    }
    if (query.entityType) {
      qb.andWhere('a.entityType = :entityType', {
        entityType: query.entityType,
      });
    }
    if (query.actorId) {
      qb.andWhere('a.actorId = :actorId', { actorId: query.actorId });
    }
    if (query.from) {
      qb.andWhere('a.createdAt >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('a.createdAt <= :to', { to: new Date(query.to) });
    }
    if (query.search) {
      qb.andWhere(
        '(a.action ILIKE :search OR a.entityType ILIKE :search OR a.actorEmail ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data: data.map(serializeAudit), meta: buildMeta(page, pageSize, total) };
  }

  async findOne(id: string, organizationId: string | null) {
    const qb = this.auditRepo
      .createQueryBuilder('a')
      .where('a.id = :id', { id });
    if (organizationId) {
      qb.andWhere('a.organizationId = :organizationId', { organizationId });
    }
    return qb.getOne();
  }
}

function serializeAudit(a: AuditLogEntity) {
  return {
    id: a.id,
    organizationId: a.organizationId,
    actorId: a.actorId,
    actorEmail: a.actorEmail,
    action: a.action,
    entityType: a.entityType,
    entityId: a.entityId,
    metadata: a.metadata,
    ipAddress: a.ipAddress,
    userAgent: a.userAgent,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}
