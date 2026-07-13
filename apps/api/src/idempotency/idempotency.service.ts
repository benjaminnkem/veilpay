import { createHash } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../common/api-error';
import { PrismaService } from '../database/prisma.service';

export interface IdempotencyAttempt {
  id: string;
  replay: boolean;
  responseStatus: number | null;
  responseBody: Prisma.JsonValue | null;
}

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}
  hash(body: unknown) {
    return createHash('sha256').update(JSON.stringify(body)).digest('hex');
  }
  async begin(
    userId: string,
    companyId: string | null,
    operation: string,
    key: string,
    body: unknown,
  ): Promise<IdempotencyAttempt> {
    if (!key)
      throw new ApiError(
        'IDEMPOTENCY_KEY_REQUIRED',
        'Idempotency-Key header is required',
      );
    const requestHash = this.hash(body);
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { userId_operation_key: { userId, operation, key } },
    });
    if (existing) {
      if (existing.expiresAt <= new Date()) {
        await this.prisma.idempotencyKey.delete({ where: { id: existing.id } });
        return this.begin(userId, companyId, operation, key, body);
      }
      if (existing.requestHash !== requestHash)
        throw new ApiError(
          'IDEMPOTENCY_KEY_CONFLICT',
          'Idempotency key was used with a different request',
          HttpStatus.CONFLICT,
        );
      if (existing.responseStatus === null)
        throw new ApiError(
          'IDEMPOTENCY_REQUEST_IN_PROGRESS',
          'A request with this idempotency key is still in progress',
          HttpStatus.CONFLICT,
        );
      return { ...existing, replay: true };
    }
    try {
      const created = await this.prisma.idempotencyKey.create({
        data: {
          userId,
          companyId,
          operation,
          key,
          requestHash,
          expiresAt: new Date(Date.now() + 86400_000),
        },
      });
      return { ...created, replay: false };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        return this.begin(userId, companyId, operation, key, body);
      throw error;
    }
  }
  async complete(id: string, status: number, body: Prisma.InputJsonValue) {
    return this.prisma.idempotencyKey.update({
      where: { id },
      data: { responseStatus: status, responseBody: body },
    });
  }

  async abandon(id: string): Promise<void> {
    await this.prisma.idempotencyKey.deleteMany({ where: { id } });
  }
}
