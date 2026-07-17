import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditAction,
  CompensationType,
  EmploymentStatus,
} from '@repo/types';
import {
  CompensationEntity,
  EmployeeEntity,
} from '../../database/entities';
import type { JwtPayloadUser } from '../../common/decorators/current-user.decorator';
import { requireOrganizationId } from '../../common/utils/org.util';
import { centsToNumber, numberToCentsString } from '../../common/utils/money.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateCompensationDto } from './dto/create-compensation.dto';
import { EndCompensationDto } from './dto/update-compensation.dto';

@Injectable()
export class CompensationService {
  constructor(
    @InjectRepository(CompensationEntity)
    private readonly compensationRepo: Repository<CompensationEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepo: Repository<EmployeeEntity>,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async create(actor: JwtPayloadUser, dto: CreateCompensationDto) {
    const orgId = requireOrganizationId(actor);
    const employee = await this.employeesRepo.findOne({
      where: { id: dto.employeeId, organizationId: orgId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    if (dto.endDate && dto.endDate < dto.effectiveDate) {
      throw new BadRequestException(
        'endDate must be on or after effectiveDate',
      );
    }

    const current = await this.compensationRepo.findOne({
      where: {
        employeeId: employee.id,
        organizationId: orgId,
        type: dto.type,
        isCurrent: true,
      },
    });

    if (current) {
      if (dto.effectiveDate <= current.effectiveDate) {
        throw new BadRequestException(
          'New compensation effectiveDate must be after the current record’s effectiveDate. Do not overwrite history.',
        );
      }

      const previousEnd = dayBefore(dto.effectiveDate);
      current.isCurrent = false;
      current.endDate =
        previousEnd >= current.effectiveDate
          ? previousEnd
          : current.effectiveDate;
      await this.compensationRepo.save(current);

      await this.auditLogs.log({
        organizationId: orgId,
        actorId: actor.id,
        actorEmail: actor.email,
        action: AuditAction.COMPENSATION_ENDED,
        entityType: 'Compensation',
        entityId: current.id,
        metadata: {
          endDate: current.endDate,
          supersededByEffectiveDate: dto.effectiveDate,
        },
      });
    }

    const record = this.compensationRepo.create({
      employeeId: employee.id,
      organizationId: orgId,
      type: dto.type,
      amountCents: numberToCentsString(dto.amountCents),
      currency: dto.currency ?? 'USD',
      frequency: dto.frequency,
      effectiveDate: dto.effectiveDate,
      endDate: dto.endDate ?? null,
      isCurrent: !dto.endDate,
      description: dto.description ?? null,
    });

    await this.compensationRepo.save(record);

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.COMPENSATION_CREATED,
      entityType: 'Compensation',
      entityId: record.id,
      metadata: {
        employeeId: employee.id,
        type: dto.type,
        supersededId: current?.id ?? null,
      },
    });

    return serializeCompensation(record);
  }

  async findByEmployee(actor: JwtPayloadUser, employeeId: string) {
    const orgId = requireOrganizationId(actor);
    const employee = await this.employeesRepo.findOne({
      where: { id: employeeId, organizationId: orgId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const records = await this.compensationRepo.find({
      where: { employeeId, organizationId: orgId },
      order: { effectiveDate: 'DESC', createdAt: 'DESC' },
    });

    return records.map(serializeCompensation);
  }

  async getCurrent(actor: JwtPayloadUser, employeeId: string) {
    const orgId = requireOrganizationId(actor);
    const records = await this.compensationRepo.find({
      where: { employeeId, organizationId: orgId, isCurrent: true },
      order: { type: 'ASC' },
    });
    return records.map(serializeCompensation);
  }

  async end(actor: JwtPayloadUser, id: string, dto: EndCompensationDto) {
    const orgId = requireOrganizationId(actor);
    const record = await this.compensationRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!record) throw new NotFoundException('Compensation not found');
    if (!record.isCurrent) {
      throw new BadRequestException('Compensation is already ended');
    }
    if (dto.endDate < record.effectiveDate) {
      throw new BadRequestException(
        'endDate must be on or after effectiveDate',
      );
    }

    record.endDate = dto.endDate;
    record.isCurrent = false;
    await this.compensationRepo.save(record);

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.COMPENSATION_ENDED,
      entityType: 'Compensation',
      entityId: record.id,
      metadata: { endDate: dto.endDate },
    });

    return serializeCompensation(record);
  }

  async getCurrentCompMap(
    organizationId: string,
    employeeIds?: string[],
  ): Promise<
    Map<
      string,
      {
        salary: number;
        bonus: number;
        allowance: number;
        deduction: number;
        currency: string;
      }
    >
  > {
    const qb = this.compensationRepo
      .createQueryBuilder('c')
      .innerJoin('c.employee', 'e')
      .where('c.organizationId = :organizationId', { organizationId })
      .andWhere('c.isCurrent = true')
      .andWhere('e.status = :status', { status: EmploymentStatus.ACTIVE });

    if (employeeIds?.length) {
      qb.andWhere('c.employeeId IN (:...employeeIds)', { employeeIds });
    }

    const rows = await qb.getMany();
    const map = new Map<
      string,
      {
        salary: number;
        bonus: number;
        allowance: number;
        deduction: number;
        currency: string;
      }
    >();

    for (const row of rows) {
      const current = map.get(row.employeeId) ?? {
        salary: 0,
        bonus: 0,
        allowance: 0,
        deduction: 0,
        currency: row.currency,
      };
      const amount = centsToNumber(row.amountCents);
      if (row.type === CompensationType.SALARY) current.salary += amount;
      if (row.type === CompensationType.BONUS) current.bonus += amount;
      if (row.type === CompensationType.ALLOWANCE) current.allowance += amount;
      if (row.type === CompensationType.DEDUCTION) current.deduction += amount;
      current.currency = row.currency;
      map.set(row.employeeId, current);
    }

    return map;
  }
}

function dayBefore(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function serializeCompensation(c: CompensationEntity) {
  return {
    id: c.id,
    employeeId: c.employeeId,
    organizationId: c.organizationId,
    type: c.type,
    amountCents: centsToNumber(c.amountCents),
    currency: c.currency,
    frequency: c.frequency,
    effectiveDate: c.effectiveDate,
    endDate: c.endDate,
    isCurrent: c.isCurrent,
    description: c.description,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
