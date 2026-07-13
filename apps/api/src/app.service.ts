import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'VeilPay API is running';
  }

  getHealth(): { status: string; service: string } {
    return { status: 'ok', service: 'api' };
  }

  /** Static compatibility sample; production company data is tenant-scoped. */
  getSampleCompany() {
    return {
      id: 'cmp_demo',
      name: 'VeilPay Demo Co',
      status: 'active',
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    };
  }
}
