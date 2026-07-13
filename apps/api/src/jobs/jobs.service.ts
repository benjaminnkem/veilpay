import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import {
  EmailDeliveryService,
  type EmailJobPayload,
} from '../email/email-delivery.service';
@Injectable()
export class JobsService {
  private readonly worker = `worker-${process.pid}`;
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailDeliveryService,
  ) {}
  @Cron('*/10 * * * * *') async poll(): Promise<void> {
    const job = await this.prisma.durableJob.findFirst({
      where: { status: 'PENDING', runAt: { lte: new Date() } },
      orderBy: { createdAt: 'asc' },
    });
    if (!job) return;
    const claim = await this.prisma.durableJob.updateMany({
      where: { id: job.id, status: 'PENDING' },
      data: {
        status: 'RUNNING',
        lockedAt: new Date(),
        lockedBy: this.worker,
        attempts: { increment: 1 },
      },
    });
    if (!claim.count) return;
    try {
      if (job.type === 'SEND_EMAIL') {
        await this.email.deliver(job.payload as unknown as EmailJobPayload);
      }
      await this.prisma.durableJob.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', lockedAt: null, lockedBy: null },
      });
    } catch (error) {
      const attempts = job.attempts + 1;
      await this.prisma.durableJob.update({
        where: { id: job.id },
        data: {
          status: attempts >= job.maxAttempts ? 'DEAD' : 'PENDING',
          runAt: new Date(
            Date.now() + Math.min(3600_000, 1000 * 2 ** attempts),
          ),
          lastError: error instanceof Error ? error.name : 'JobError',
          lockedAt: null,
          lockedBy: null,
        },
      });
    }
  }
}
