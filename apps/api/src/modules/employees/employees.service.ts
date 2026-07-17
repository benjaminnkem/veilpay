import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, EmploymentStatus } from '@repo/types';
import { EmployeeEntity } from '../../database/entities';
import { buildMeta } from '../../common/dto/pagination.dto';
import type { JwtPayloadUser } from '../../common/decorators/current-user.decorator';
import { requireOrganizationId } from '../../common/utils/org.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepo: Repository<EmployeeEntity>,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async create(actor: JwtPayloadUser, dto: CreateEmployeeDto) {
    const orgId = requireOrganizationId(actor);
    const email = dto.email.toLowerCase();

    const existing = await this.employeesRepo.findOne({
      where: { organizationId: orgId, email },
    });
    if (existing) {
      throw new ConflictException('Employee with this email already exists');
    }

    const employee = this.employeesRepo.create({
      organizationId: orgId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email,
      department: dto.department ?? null,
      position: dto.position ?? null,
      status: dto.status ?? EmploymentStatus.ACTIVE,
      hireDate: dto.hireDate ?? null,
      walletAddress: dto.walletAddress ?? null,
      managerId: dto.managerId ?? null,
      phone: dto.phone ?? null,
      country: dto.country ?? null,
      notes: dto.notes ?? null,
      employeeNumber: dto.employeeNumber ?? null,
    });

    await this.employeesRepo.save(employee);

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.EMPLOYEE_CREATED,
      entityType: 'Employee',
      entityId: employee.id,
      metadata: { email },
    });

    return serializeEmployee(employee);
  }

  async findAll(actor: JwtPayloadUser, query: EmployeeQueryDto) {
    const orgId = requireOrganizationId(actor);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const qb = this.employeesRepo
      .createQueryBuilder('e')
      .where('e.organizationId = :orgId', { orgId })
      .orderBy('e.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (query.status) {
      qb.andWhere('e.status = :status', { status: query.status });
    }
    if (query.department) {
      qb.andWhere('e.department = :department', {
        department: query.department,
      });
    }
    if (query.search) {
      qb.andWhere(
        '(e.firstName ILIKE :s OR e.lastName ILIKE :s OR e.email ILIKE :s OR e.department ILIKE :s OR e.position ILIKE :s)',
        { s: `%${query.search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data: data.map(serializeEmployee),
      meta: buildMeta(page, pageSize, total),
    };
  }

  async findOne(actor: JwtPayloadUser, id: string) {
    const orgId = requireOrganizationId(actor);
    const employee = await this.employeesRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return serializeEmployee(employee);
  }

  async update(actor: JwtPayloadUser, id: string, dto: UpdateEmployeeDto) {
    const orgId = requireOrganizationId(actor);
    const employee = await this.employeesRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    if (dto.email && dto.email.toLowerCase() !== employee.email) {
      const conflict = await this.employeesRepo.findOne({
        where: { organizationId: orgId, email: dto.email.toLowerCase() },
      });
      if (conflict) {
        throw new ConflictException('Employee with this email already exists');
      }
    }

    Object.assign(employee, {
      firstName: dto.firstName ?? employee.firstName,
      lastName: dto.lastName ?? employee.lastName,
      email: dto.email ? dto.email.toLowerCase() : employee.email,
      department:
        dto.department !== undefined ? dto.department : employee.department,
      position: dto.position !== undefined ? dto.position : employee.position,
      status: dto.status ?? employee.status,
      hireDate: dto.hireDate !== undefined ? dto.hireDate : employee.hireDate,
      terminationDate:
        dto.terminationDate !== undefined
          ? dto.terminationDate
          : employee.terminationDate,
      walletAddress:
        dto.walletAddress !== undefined
          ? dto.walletAddress
          : employee.walletAddress,
      managerId:
        dto.managerId !== undefined ? dto.managerId : employee.managerId,
      phone: dto.phone !== undefined ? dto.phone : employee.phone,
      country: dto.country !== undefined ? dto.country : employee.country,
      notes: dto.notes !== undefined ? dto.notes : employee.notes,
      employeeNumber:
        dto.employeeNumber !== undefined
          ? dto.employeeNumber
          : employee.employeeNumber,
    });

    await this.employeesRepo.save(employee);

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.EMPLOYEE_UPDATED,
      entityType: 'Employee',
      entityId: employee.id,
      metadata: { fields: Object.keys(dto) },
    });

    return serializeEmployee(employee);
  }

  async remove(actor: JwtPayloadUser, id: string) {
    const orgId = requireOrganizationId(actor);
    const employee = await this.employeesRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    // Soft-delete via status
    employee.status = EmploymentStatus.TERMINATED;
    employee.terminationDate =
      employee.terminationDate ?? new Date().toISOString().slice(0, 10);
    await this.employeesRepo.save(employee);

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.EMPLOYEE_DELETED,
      entityType: 'Employee',
      entityId: employee.id,
    });

    return { message: 'Employee terminated', id: employee.id };
  }

  async departments(actor: JwtPayloadUser) {
    const orgId = requireOrganizationId(actor);
    const rows = await this.employeesRepo
      .createQueryBuilder('e')
      .select('e.department', 'name')
      .addSelect('COUNT(*)', 'employeeCount')
      .where('e.organizationId = :orgId', { orgId })
      .andWhere('e.department IS NOT NULL')
      .groupBy('e.department')
      .orderBy('e.department', 'ASC')
      .getRawMany<{ name: string; employeeCount: string }>();

    return rows.map((r) => ({
      name: r.name,
      employeeCount: Number(r.employeeCount),
    }));
  }

  async suspend(actor: JwtPayloadUser, id: string) {
    const orgId = requireOrganizationId(actor);
    const employee = await this.employeesRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    employee.status = EmploymentStatus.INACTIVE;
    await this.employeesRepo.save(employee);

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.EMPLOYEE_UPDATED,
      entityType: 'Employee',
      entityId: employee.id,
      metadata: { action: 'suspend' },
    });

    return serializeEmployee(employee);
  }

  async reactivate(actor: JwtPayloadUser, id: string) {
    const orgId = requireOrganizationId(actor);
    const employee = await this.employeesRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    employee.status = EmploymentStatus.ACTIVE;
    employee.terminationDate = null;
    await this.employeesRepo.save(employee);

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.EMPLOYEE_UPDATED,
      entityType: 'Employee',
      entityId: employee.id,
      metadata: { action: 'reactivate' },
    });

    return serializeEmployee(employee);
  }

  async bulkImport(
    actor: JwtPayloadUser,
    rows: Array<{
      firstName: string;
      lastName: string;
      email: string;
      department?: string;
      position?: string;
      walletAddress?: string;
    }>,
  ) {
    const orgId = requireOrganizationId(actor);
    const created: string[] = [];
    const skipped: Array<{ email: string; reason: string }> = [];

    for (const row of rows) {
      const email = row.email?.toLowerCase?.() ?? '';
      if (!email || !row.firstName || !row.lastName) {
        skipped.push({
          email: email || '(missing)',
          reason: 'firstName, lastName, and email are required',
        });
        continue;
      }

      const existing = await this.employeesRepo.findOne({
        where: { organizationId: orgId, email },
      });
      if (existing) {
        skipped.push({ email, reason: 'already exists' });
        continue;
      }

      const employee = this.employeesRepo.create({
        organizationId: orgId,
        firstName: row.firstName,
        lastName: row.lastName,
        email,
        department: row.department ?? null,
        position: row.position ?? null,
        status: EmploymentStatus.ONBOARDING,
        walletAddress: row.walletAddress ?? null,
      });
      await this.employeesRepo.save(employee);
      created.push(employee.id);

      await this.auditLogs.log({
        organizationId: orgId,
        actorId: actor.id,
        actorEmail: actor.email,
        action: AuditAction.EMPLOYEE_CREATED,
        entityType: 'Employee',
        entityId: employee.id,
        metadata: { email, source: 'bulk_import' },
      });
    }

    return {
      created: created.length,
      skipped: skipped.length,
      createdIds: created,
      errors: skipped,
      message:
        'CSV bulk import processed. Full file upload pipeline can replace this JSON endpoint later.',
    };
  }
}

export function serializeEmployee(e: EmployeeEntity) {
  return {
    id: e.id,
    organizationId: e.organizationId,
    userId: e.userId,
    employeeNumber: e.employeeNumber,
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    department: e.department,
    position: e.position,
    title: e.position,
    status: e.status,
    hireDate: e.hireDate,
    terminationDate: e.terminationDate,
    walletAddress: e.walletAddress,
    managerId: e.managerId,
    phone: e.phone,
    country: e.country,
    notes: e.notes,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}
