import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  async record(
    actorUserId: string | null,
    companyId: string | null,
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: any,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        companyId,
        action,
        resourceType,
        resourceId,
        metadata,
      },
    });
  }
}
