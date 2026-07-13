import { randomBytes } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import type { MemberRole } from '@prisma/client';
import { ApiError } from '../common/api-error';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async assertRole(userId: string, companyId: string, roles?: MemberRole[]) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId } },
    });
    if (
      !membership ||
      membership.status !== 'ACTIVE' ||
      (roles && !roles.includes(membership.role))
    )
      throw new ApiError(
        'COMPANY_ACCESS_DENIED',
        'Company access denied',
        HttpStatus.FORBIDDEN,
      );
    return membership;
  }

  async create(userId: string, name: string) {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || 'company';
    const slug = `${base}-${randomBytes(3).toString('hex')}`;
    const company = await this.prisma.$transaction(async (tx) => {
      const created = await tx.company.create({ data: { name, slug } });
      await tx.companyMember.create({
        data: { companyId: created.id, userId, role: 'OWNER' },
      });
      return created;
    });
    await this.audit.record(
      userId,
      company.id,
      'COMPANY_CREATED',
      'Company',
      company.id,
    );
    return company;
  }

  list(userId: string) {
    return this.prisma.company.findMany({
      where: { members: { some: { userId, status: 'ACTIVE' } } },
      include: { safeAccounts: true },
      orderBy: { createdAt: 'desc' },
    });
  }
  async get(userId: string, companyId: string) {
    await this.assertRole(userId, companyId);
    return this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      include: { safeAccounts: true },
    });
  }
  async update(userId: string, companyId: string, name: string) {
    await this.assertRole(userId, companyId, ['OWNER', 'ADMIN']);
    return this.prisma.company.update({
      where: { id: companyId },
      data: { name },
    });
  }
  async members(userId: string, companyId: string) {
    await this.assertRole(userId, companyId);
    return this.prisma.companyMember.findMany({
      where: { companyId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }
  async updateRole(
    userId: string,
    companyId: string,
    memberId: string,
    role: MemberRole,
  ) {
    await this.assertRole(userId, companyId, ['OWNER']);
    const member = await this.prisma.companyMember.findFirst({
      where: { id: memberId, companyId },
    });
    if (!member)
      throw new ApiError(
        'COMPANY_MEMBER_NOT_FOUND',
        'Member not found',
        HttpStatus.NOT_FOUND,
      );
    if (member.role === 'OWNER')
      throw new ApiError(
        'COMPANY_OWNER_ROLE_IMMUTABLE',
        'Owner role cannot be changed',
      );
    return this.prisma.companyMember.update({
      where: { id: member.id },
      data: { role },
    });
  }
}
