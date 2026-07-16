import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, OrganizationStatus, UserRole } from '@repo/types';
import {
  OrganizationEntity,
  OrganizationSettingsEntity,
  RefreshTokenEntity,
  UserEntity,
} from '../../database/entities';
import { hashPassword, verifyPassword } from '../../common/utils/password.util';
import { generateSecureToken, hashToken } from '../../common/utils/token.util';
import { MailService } from '../../mail/mail.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly orgRepo: Repository<OrganizationEntity>,
    @InjectRepository(OrganizationSettingsEntity)
    private readonly settingsRepo: Repository<OrganizationSettingsEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshRepo: Repository<RefreshTokenEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditLogs: AuditLogsService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const org = this.orgRepo.create({
      name: dto.organizationName,
      legalName: dto.organizationName,
      status: OrganizationStatus.ACTIVE,
      currency: 'USD',
      timezone: 'UTC',
    });
    await this.orgRepo.save(org);

    const settings = this.settingsRepo.create({
      organizationId: org.id,
      payrollApprovalRequired: true,
      defaultApprovalSequence: ['HR', 'FINANCE', 'CEO'],
      autoGeneratePayrollItems: true,
      notificationEmailEnabled: false,
      fiscalYearStartMonth: 1,
    });
    await this.settingsRepo.save(settings);

    const user = this.usersRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash: await hashPassword(dto.password),
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.OWNER,
      organizationId: org.id,
      isActive: true,
    });
    await this.usersRepo.save(user);

    await this.auditLogs.log({
      organizationId: org.id,
      actorId: user.id,
      actorEmail: user.email,
      action: AuditAction.USER_REGISTERED,
      entityType: 'User',
      entityId: user.id,
      metadata: { organizationName: org.name },
    });

    await this.auditLogs.log({
      organizationId: org.id,
      actorId: user.id,
      actorEmail: user.email,
      action: AuditAction.ORGANIZATION_CREATED,
      entityType: 'Organization',
      entityId: org.id,
    });

    await this.mail.sendWelcome({
      to: user.email,
      firstName: user.firstName,
      organizationName: org.name,
    });

    return this.issueAuthResponse(user, org.name);
  }

  async login(
    dto: LoginDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email.toLowerCase() },
      relations: { organization: true },
    });

    if (!user || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    user.lastLoginAt = new Date();
    await this.usersRepo.save(user);

    await this.auditLogs.log({
      organizationId: user.organizationId,
      actorId: user.id,
      actorEmail: user.email,
      action: AuditAction.USER_LOGIN,
      entityType: 'User',
      entityId: user.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    const orgName = user.organization?.name ?? null;
    return this.issueAuthResponse(user, orgName, meta);
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.refreshRepo.findOne({
      where: { tokenHash },
      relations: { user: { organization: true } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    stored.revokedAt = new Date();
    await this.refreshRepo.save(stored);

    return this.issueAuthResponse(
      stored.user,
      stored.user.organization?.name ?? null,
    );
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await this.refreshRepo.update(
        { userId, tokenHash, revokedAt: undefined as never },
        { revokedAt: new Date() },
      );
    } else {
      await this.refreshRepo
        .createQueryBuilder()
        .update()
        .set({ revokedAt: new Date() })
        .where('userId = :userId AND revokedAt IS NULL', { userId })
        .execute();
    }

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (user) {
      await this.auditLogs.log({
        organizationId: user.organizationId,
        actorId: user.id,
        actorEmail: user.email,
        action: AuditAction.USER_LOGOUT,
        entityType: 'User',
        entityId: user.id,
      });
    }

    return { message: 'Logged out successfully' };
  }

  async me(userId: string) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: { organization: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.serializeUser(user, user.organization?.name ?? null);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    if (!(await verifyPassword(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.passwordHash = await hashPassword(dto.newPassword);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await this.usersRepo.save(user);

    await this.refreshRepo
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where('userId = :userId AND revokedAt IS NULL', { userId })
      .execute();

    await this.mail.sendPasswordChanged({
      to: user.email,
      firstName: user.firstName,
    });

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (user?.isActive) {
      const rawToken = generateSecureToken(32);
      user.passwordResetTokenHash = hashToken(rawToken);
      user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await this.usersRepo.save(user);

      await this.mail.sendForgotPassword({
        to: user.email,
        firstName: user.firstName,
        resetToken: rawToken,
      });
    }

    return {
      message:
        'If an account exists for that email, a reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashToken(dto.token);
    const user = await this.usersRepo.findOne({
      where: { passwordResetTokenHash: tokenHash },
    });

    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    user.passwordHash = await hashPassword(dto.newPassword);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await this.usersRepo.save(user);

    await this.refreshRepo
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where('userId = :userId AND revokedAt IS NULL', { userId: user.id })
      .execute();

    await this.mail.sendPasswordChanged({
      to: user.email,
      firstName: user.firstName,
    });

    return { message: 'Password reset successfully' };
  }

  private async issueAuthResponse(
    user: UserEntity,
    organizationName: string | null,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const accessExpiresIn = this.config.get<string>('jwt.accessExpiresIn')!;
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn')!;

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        type: 'access',
      },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: accessExpiresIn as never,
      },
    );

    const rawRefresh = generateSecureToken(48);
    const refreshDays = this.parseExpiryDays(refreshExpiresIn);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshDays);

    const refreshEntity = this.refreshRepo.create({
      userId: user.id,
      tokenHash: hashToken(rawRefresh),
      expiresAt,
      userAgent: meta?.userAgent ?? null,
      ipAddress: meta?.ipAddress ?? null,
    });
    await this.refreshRepo.save(refreshEntity);

    const expiresInSeconds = this.parseExpirySeconds(accessExpiresIn);

    return {
      user: this.serializeUser(user, organizationName),
      accessToken,
      refreshToken: rawRefresh,
      expiresIn: expiresInSeconds,
    };
  }

  private serializeUser(user: UserEntity, organizationName: string | null) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
      organizationId: user.organizationId,
      organizationName,
      avatarUrl: user.avatarUrl,
      walletAddress: user.walletAddress,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt?.toISOString?.() ?? undefined,
      updatedAt: user.updatedAt?.toISOString?.() ?? undefined,
    };
  }

  private parseExpiryDays(value: string): number {
    if (value.endsWith('d')) return parseInt(value, 10) || 7;
    if (value.endsWith('h')) return Math.ceil((parseInt(value, 10) || 24) / 24);
    return 7;
  }

  private parseExpirySeconds(value: string): number {
    if (value.endsWith('m')) return (parseInt(value, 10) || 15) * 60;
    if (value.endsWith('h')) return (parseInt(value, 10) || 1) * 3600;
    if (value.endsWith('d')) return (parseInt(value, 10) || 1) * 86400;
    if (value.endsWith('s')) return parseInt(value, 10) || 900;
    return 900;
  }
}
