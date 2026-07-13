import { createHash, randomBytes } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ApiError } from '../common/api-error';
import { CompaniesService } from '../companies/companies.service';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import type { UpdateEmployeeDto } from '../common/dto';

const hash = (v: string) => createHash('sha256').update(v).digest('hex');

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companies: CompaniesService,
    private readonly crypto: FieldEncryptionService,
    private readonly email: EmailService,
    private readonly audit: AuditService,
  ) {}

  private publicEmployee<T extends { salaryCiphertext: Uint8Array | null }>(
    employee: T,
  ) {
    const { salaryCiphertext, ...safe } = employee;
    return {
      ...safe,
      salaryCiphertext: salaryCiphertext ? '[ENCRYPTED]' : null,
    };
  }

  private publicInvitation(invitation: {
    id: string;
    companyId: string;
    email: string;
    displayName: string;
    status: string;
    expiresAt: Date;
    acceptedAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: invitation.id,
      companyId: invitation.companyId,
      email: invitation.email,
      displayName: invitation.displayName,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      revokedAt: invitation.revokedAt,
      createdAt: invitation.createdAt,
    };
  }
  async invite(
    userId: string,
    companyId: string,
    displayName: string,
    email: string,
  ) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'HR',
    ]);
    const normalized = email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { emailNormalized: normalized },
      select: { id: true },
    });
    const token = randomBytes(32).toString('base64url');
    const invitation = await this.prisma.employeeInvitation.create({
      data: {
        companyId,
        inviterUserId: userId,
        displayName,
        email: normalized,
        emailNormalized: normalized,
        tokenHash: hash(token),
        expiresAt: new Date(Date.now() + 7 * 86400_000),
      },
    });
    await this.email.enqueue(normalized, 'invitation', {
      token,
      companyId,
      entrypoint: existingUser ? 'sign-in' : 'sign-up',
    });
    await this.audit.record(
      userId,
      companyId,
      'EMPLOYEE_INVITED',
      'EmployeeInvitation',
      invitation.id,
      { email: normalized },
    );
    return {
      ...this.publicInvitation(invitation),
      ...(process.env.NODE_ENV === 'test' ? { testToken: token } : {}),
    };
  }
  async invitations(userId: string, companyId: string) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'HR',
    ]);
    return this.prisma.employeeInvitation.findMany({
      where: { companyId },
      select: {
        id: true,
        companyId: true,
        email: true,
        displayName: true,
        status: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }
  async revoke(userId: string, companyId: string, id: string) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'HR',
    ]);
    const invitation = await this.prisma.employeeInvitation.findFirst({
      where: { id, companyId, status: 'PENDING' },
    });
    if (!invitation)
      throw new ApiError('INVITATION_NOT_PENDING', 'Invitation is not pending');
    const updated = await this.prisma.employeeInvitation.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });
    return this.publicInvitation(updated);
  }
  async accept(userId: string, rawToken: string) {
    const invitation = await this.prisma.employeeInvitation.findUnique({
      where: { tokenHash: hash(rawToken) },
    });
    if (
      !invitation ||
      invitation.status !== 'PENDING' ||
      invitation.expiresAt <= new Date()
    )
      throw new ApiError(
        'INVITATION_INVALID',
        'Invitation is invalid or expired',
      );
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { wallets: { where: { isPrimary: true }, take: 1 } },
    });
    if (user.emailNormalized !== invitation.emailNormalized)
      throw new ApiError(
        'INVITATION_EMAIL_MISMATCH',
        'Sign in with the invited email',
        HttpStatus.FORBIDDEN,
      );
    return this.prisma.$transaction(async (tx) => {
      const consumed = await tx.employeeInvitation.updateMany({
        where: { id: invitation.id, status: 'PENDING' },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });
      if (consumed.count !== 1)
        throw new ApiError(
          'INVITATION_ALREADY_USED',
          'Invitation was already accepted',
        );
      const member = await tx.companyMember.upsert({
        where: {
          companyId_userId: { companyId: invitation.companyId, userId },
        },
        update: { status: 'ACTIVE', role: 'EMPLOYEE' },
        create: { companyId: invitation.companyId, userId, role: 'EMPLOYEE' },
      });
      const profile = await tx.employeeProfile.create({
        data: {
          companyId: invitation.companyId,
          userId,
          companyMemberId: member.id,
          displayName: invitation.displayName,
          email: invitation.email,
          walletId: user.wallets[0]?.id,
        },
      });
      return this.publicEmployee(profile);
    });
  }
  async list(userId: string, companyId: string, skip = 0, take = 20) {
    await this.companies.assertRole(userId, companyId);
    const employees = await this.prisma.employeeProfile.findMany({
      where: { companyId },
      skip,
      take,
      include: { wallet: { select: { address: true, verifiedAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return employees.map((employee) => this.publicEmployee(employee));
  }
  async get(userId: string, companyId: string, id: string) {
    await this.companies.assertRole(userId, companyId);
    const employee = await this.prisma.employeeProfile.findFirst({
      where: { id, companyId },
      include: { wallet: { select: { address: true, verifiedAt: true } } },
    });
    if (!employee)
      throw new ApiError(
        'EMPLOYEE_NOT_FOUND',
        'Employee not found',
        HttpStatus.NOT_FOUND,
      );
    return this.publicEmployee(employee);
  }
  async update(
    userId: string,
    companyId: string,
    id: string,
    dto: UpdateEmployeeDto,
  ) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'HR',
    ]);
    const employee = await this.prisma.employeeProfile.findFirst({
      where: { id, companyId },
    });
    if (!employee)
      throw new ApiError(
        'EMPLOYEE_NOT_FOUND',
        'Employee not found',
        HttpStatus.NOT_FOUND,
      );
    if (!dto.salaryTokenAddress) {
      dto.salaryTokenAddress = process.env.CONFIDENTIAL_TOKEN_ADDRESS;
    }
    let salaryCiphertext: Buffer | undefined;
    if (dto.salary !== undefined) {
      let salary: Decimal;
      try {
        salary = new Decimal(dto.salary);
      } catch {
        throw new ApiError('SALARY_INVALID', 'Salary must be a decimal string');
      }
      if (!salary.isPositive() || salary.decimalPlaces() > 6)
        throw new ApiError(
          'SALARY_INVALID',
          'Salary must be positive with at most 6 decimal places',
        );
      salaryCiphertext = this.crypto.encrypt(
        salary.toFixed(),
        companyId,
        employee.id,
      );
    }
    const updated = await this.prisma.employeeProfile.update({
      where: { id: employee.id },
      data: {
        displayName: dto.displayName,
        salaryCiphertext: salaryCiphertext
          ? new Uint8Array(salaryCiphertext)
          : undefined,
        salaryTokenAddress: dto.salaryTokenAddress,
        payFrequency: dto.payFrequency,
      },
    });
    await this.audit.record(
      userId,
      companyId,
      'EMPLOYEE_UPDATED',
      'EmployeeProfile',
      id,
      { salaryChanged: dto.salary !== undefined },
    );
    return this.publicEmployee(updated);
  }
  async activate(userId: string, companyId: string, id: string) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'HR',
    ]);
    const employee = await this.prisma.employeeProfile.findFirst({
      where: { id, companyId },
      include: {
        user: { include: { wallets: { where: { isPrimary: true }, take: 1 } } },
      },
    });
    if (!employee)
      throw new ApiError(
        'EMPLOYEE_NOT_FOUND',
        'Employee not found',
        HttpStatus.NOT_FOUND,
      );
    const wallet = employee.walletId ? null : employee.user.wallets[0];
    if (
      (!employee.walletId && !wallet) ||
      !employee.salaryCiphertext ||
      !employee.salaryTokenAddress
    )
      throw new ApiError(
        'EMPLOYEE_INCOMPLETE',
        'Verified wallet and salary details are required',
      );
    const updated = await this.prisma.employeeProfile.update({
      where: { id },
      data: {
        employmentStatus: 'ACTIVE',
        walletId: employee.walletId ?? wallet!.id,
      },
    });
    return this.publicEmployee(updated);
  }
  async deactivate(userId: string, companyId: string, id: string) {
    await this.companies.assertRole(userId, companyId, [
      'OWNER',
      'ADMIN',
      'HR',
    ]);
    const result = await this.prisma.employeeProfile.updateMany({
      where: { id, companyId },
      data: { employmentStatus: 'INACTIVE' },
    });
    if (!result.count)
      throw new ApiError(
        'EMPLOYEE_NOT_FOUND',
        'Employee not found',
        HttpStatus.NOT_FOUND,
      );
    return { deactivated: true };
  }
}
