import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class EmailService {
  constructor(private readonly prisma: PrismaService) {}
  async enqueue(
    to: string,
    template: 'verify-email' | 'reset-password' | 'invitation',
    variables: Record<string, string>,
  ): Promise<void> {
    await this.prisma.durableJob.create({
      data: { type: 'SEND_EMAIL', payload: { to, template, variables } },
    });
  }
}
