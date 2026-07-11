import { Injectable } from '@nestjs/common';
import type { Company } from '@repo/types';

@Injectable()
export class AppService {
  getHello(): string {
    return 'VeilPay API is running';
  }

  getHealth(): { status: string; service: string } {
    return { status: 'ok', service: 'api' };
  }

  /** Example shape shared via @repo/types — replace with real data later. */
  getSampleCompany(): Company {
    return {
      id: 'cmp_demo',
      name: 'VeilPay Demo Co',
      status: 'active',
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    };
  }
}
