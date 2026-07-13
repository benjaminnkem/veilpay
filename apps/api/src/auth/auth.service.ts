import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { ApiError } from '../common/api-error';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const opaqueToken = () => randomBytes(32).toString('base64url');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  async signup(name: string, email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { emailNormalized: normalized },
    });
    if (existing)
      throw new ApiError(
        'AUTH_EMAIL_UNAVAILABLE',
        'Unable to create account',
        HttpStatus.CONFLICT,
      );
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
    const verificationToken = opaqueToken();
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email: normalized,
          emailNormalized: normalized,
          passwordHash,
        },
      });
      await tx.oneTimeToken.create({
        data: {
          userId: created.id,
          purpose: 'VERIFY_EMAIL',
          tokenHash: sha256(verificationToken),
          expiresAt: new Date(Date.now() + 24 * 3600_000),
        },
      });
      return created;
    });
    await this.email.enqueue(normalized, 'verify-email', {
      token: verificationToken,
    });
    return { id: user.id, email: user.email, emailVerificationRequired: true };
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.oneTimeToken.findUnique({
      where: { tokenHash: sha256(token) },
    });
    if (
      !record ||
      record.purpose !== 'VERIFY_EMAIL' ||
      record.usedAt ||
      record.expiresAt <= new Date()
    )
      throw new ApiError('AUTH_TOKEN_INVALID', 'Token is invalid or expired');
    await this.prisma.$transaction([
      this.prisma.oneTimeToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date(), status: 'ACTIVE' },
      }),
    ]);
    return { verified: true };
  }

  async login(
    email: string,
    password: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { emailNormalized: email.trim().toLowerCase() },
    });
    if (!user || !(await argon2.verify(user.passwordHash, password)))
      throw new ApiError(
        'AUTH_INVALID_CREDENTIALS',
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    if (!user.emailVerifiedAt)
      throw new ApiError(
        'AUTH_EMAIL_NOT_VERIFIED',
        'Email verification is required',
        HttpStatus.FORBIDDEN,
      );
    if (user.status !== 'ACTIVE')
      throw new ApiError(
        'AUTH_ACCOUNT_DISABLED',
        'Account is unavailable',
        HttpStatus.FORBIDDEN,
      );
    return this.issueTokens(
      user.id,
      user.email,
      randomUUID(),
      userAgent,
      ipAddress,
    );
  }

  private async issueTokens(
    userId: string,
    email: string,
    familyId: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const accessToken = await this.jwt.signAsync(
      { id: userId, email },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as never,
      },
    );
    const sessionId = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, sid: sessionId, familyId },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 2_592_000),
      },
    );
    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId,
        familyId,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(
          Date.now() +
            Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 2_592_000) * 1000,
        ),
        userAgent,
        ipAddress,
      },
    });
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_ACCESS_TTL ?? '15m',
    };
  }

  async refresh(raw: string) {
    let payload: { sub: string; sid: string; familyId: string };
    try {
      payload = await this.jwt.verifyAsync(raw, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new ApiError(
        'AUTH_REFRESH_INVALID',
        'Refresh token is invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });
    if (
      !session ||
      session.tokenHash !== sha256(raw) ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      if (session)
        await this.prisma.session.updateMany({
          where: { familyId: session.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      throw new ApiError(
        'AUTH_REFRESH_REUSED',
        'Refresh token is invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(
      session.userId,
      session.user.email,
      session.familyId,
      session.userAgent ?? undefined,
      session.ipAddress ?? undefined,
    );
  }

  async logout(raw: string): Promise<{ revoked: boolean }> {
    await this.prisma.session.updateMany({
      where: { tokenHash: sha256(raw), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { revoked: true };
  }

  async forgotPassword(email: string): Promise<{ accepted: true }> {
    const user = await this.prisma.user.findUnique({
      where: { emailNormalized: email.trim().toLowerCase() },
    });
    if (user) {
      const token = opaqueToken();
      await this.prisma.oneTimeToken.create({
        data: {
          userId: user.id,
          purpose: 'RESET_PASSWORD',
          tokenHash: sha256(token),
          expiresAt: new Date(Date.now() + 3600_000),
        },
      });
      await this.email.enqueue(user.email, 'reset-password', { token });
    }
    return { accepted: true };
  }

  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ reset: true }> {
    const record = await this.prisma.oneTimeToken.findUnique({
      where: { tokenHash: sha256(token) },
    });
    if (
      !record ||
      record.purpose !== 'RESET_PASSWORD' ||
      record.usedAt ||
      record.expiresAt <= new Date()
    )
      throw new ApiError('AUTH_TOKEN_INVALID', 'Token is invalid or expired');
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await this.prisma.$transaction([
      this.prisma.oneTimeToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { reset: true };
  }
}
