import { Controller, Get } from '@nestjs/common';
import type { Company } from '@repo/types';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; service: string } {
    return this.appService.getHealth();
  }

  @Get('demo/company')
  getSampleCompany(): Company {
    return this.appService.getSampleCompany();
  }
}
