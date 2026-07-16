import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditAction,
  EmploymentStatus,
  InvitationStatus,
  InvitationType,
  NotificationType,
} from '@repo/types';
import {
  EmployeeEntity,
  InvitationEntity,
  OrganizationEntity,
  UserEntity,
} from '../../database/entities';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';
import type { JwtPayloadUser } from '../../common/decorators/current-user.decorator';
import { requireOrganizationId } from '../../common/utils/org.util';
import { hashPassword } from '../../common/utils/password.util';
import { generateSecureToken, hashToken } from '../../common/utils/token.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthService } from '../auth/auth.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(InvitationEntity)
    private readonly invitationRepo: Repository<InvitationEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepo: Repository<EmployeeEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly orgRepo: Repository<OrganizationEntity>,
    private readonly config: ConfigService,
    private readonly auditLogs: AuditLogsService,
    private readonly notifications: NotificationsService,
    private readonly authService: AuthService,
  ) {}

  async create(actor: JwtPayloadUser, dto: CreateInvitationDto) {
    const orgId = requireOrganizationId(actor);
    const email = dto.email.toLowerCase();

    const existingUser = await this.usersRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const pending = await this.invitationRepo.findOne({
      where: {
        organizationId: orgId,
        email,
        status: InvitationStatus.PENDING,
      },
    });
    if (pending) {
      throw new ConflictException('A pending invitation already exists');
    }

    const rawToken = generateSecureToken(32);
    const expiryDays =
      dto.expiresInDays ??
      this.config.get<number>('app.invitationExpiryDays') ??
      7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const invitation = this.invitationRepo.create({
      organizationId: orgId,
      email,
      role: dto.role,
      type: dto.type ?? InvitationType.USER,
      status: InvitationStatus.PENDING,
      tokenHash: hashToken(rawToken),
      invitedById: actor.id,
      expiresAt,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      department: dto.department ?? null,
      position: dto.position ?? null,
    });

    await this.invitationRepo.save(invitation);

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.INVITATION_SENT,
      entityType: 'Invitation',
      entityId: invitation.id,
      metadata: { email, role: dto.role },
    });

    await this.notifications.create({
      userId: actor.id,
      organizationId: orgId,
      type: NotificationType.INVITATION,
      title: 'Invitation sent',
      body: `Invited ${email} as ${dto.role}`,
    });

    return {
      ...serializeInvitation(invitation),
      token: rawToken,
    };
  }

  async findAll(actor: JwtPayloadUser, query: PaginationDto) {
    const orgId = requireOrganizationId(actor);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const qb = this.invitationRepo
      .createQueryBuilder('i')
      .where('i.organizationId = :orgId', { orgId })
      .orderBy('i.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (query.search) {
      qb.andWhere('i.email ILIKE :s', { s: `%${query.search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data: data.map(serializeInvitation),
      meta: buildMeta(page, pageSize, total),
    };
  }

  async getPublicInfo(token: string) {
    const invitation = await this.findByToken(token);
    const org = await this.orgRepo.findOne({
      where: { id: invitation.organizationId },
    });

    return {
      email: invitation.email,
      role: invitation.role,
      organizationName: org?.name ?? 'Organization',
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      expiresAt: invitation.expiresAt.toISOString(),
      status: invitation.status,
    };
  }

  async accept(dto: AcceptInvitationDto) {
    const invitation = await this.findByToken(dto.token);

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is no longer valid');
    }
    if (invitation.expiresAt < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepo.save(invitation);
      throw new BadRequestException('Invitation has expired');
    }

    const email = invitation.email;
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const user = this.usersRepo.create({
      email,
      passwordHash: await hashPassword(dto.password),
      firstName: dto.firstName ?? invitation.firstName ?? 'User',
      lastName: dto.lastName ?? invitation.lastName ?? '',
      role: invitation.role,
      organizationId: invitation.organizationId,
      isActive: true,
    });
    await this.usersRepo.save(user);

    if (invitation.type === InvitationType.EMPLOYEE) {
      const empExisting = await this.employeesRepo.findOne({
        where: { organizationId: invitation.organizationId, email },
      });
      if (!empExisting) {
        const emp = this.employeesRepo.create({
          organizationId: invitation.organizationId,
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email,
          department: invitation.department,
          position: invitation.position,
          status: EmploymentStatus.ONBOARDING,
          hireDate: new Date().toISOString().slice(0, 10),
        });
        await this.employeesRepo.save(emp);
      } else {
        empExisting.userId = user.id;
        await this.employeesRepo.save(empExisting);
      }
    }

    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedAt = new Date();
    await this.invitationRepo.save(invitation);

    await this.auditLogs.log({
      organizationId: invitation.organizationId,
      actorId: user.id,
      actorEmail: user.email,
      action: AuditAction.INVITATION_ACCEPTED,
      entityType: 'Invitation',
      entityId: invitation.id,
    });

    // Issue tokens via login path
    return this.authService.login({
      email: user.email,
      password: dto.password,
    });
  }

  async revoke(actor: JwtPayloadUser, id: string) {
    const orgId = requireOrganizationId(actor);
    const invitation = await this.invitationRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be revoked');
    }

    invitation.status = InvitationStatus.REVOKED;
    await this.invitationRepo.save(invitation);

    await this.auditLogs.log({
      organizationId: orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.INVITATION_REVOKED,
      entityType: 'Invitation',
      entityId: invitation.id,
    });

    return serializeInvitation(invitation);
  }

  private async findByToken(token: string): Promise<InvitationEntity> {
    const invitation = await this.invitationRepo.findOne({
      where: { tokenHash: hashToken(token) },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    return invitation;
  }
}

function serializeInvitation(i: InvitationEntity) {
  return {
    id: i.id,
    organizationId: i.organizationId,
    email: i.email,
    role: i.role,
    type: i.type,
    status: i.status,
    invitedById: i.invitedById,
    expiresAt: i.expiresAt.toISOString(),
    acceptedAt: i.acceptedAt?.toISOString() ?? null,
    firstName: i.firstName,
    lastName: i.lastName,
    department: i.department,
    position: i.position,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}
