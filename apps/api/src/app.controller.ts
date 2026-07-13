import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/auth-context';
import { LegacyHealthResponseDto } from './common/openapi.models';

@ApiTags('Legacy and demo')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get the API greeting',
    description:
      'Legacy root endpoint retained for compatibility. Use /health/live for health checks.',
  })
  @ApiOkResponse({
    description: 'Plain-text API greeting.',
    schema: { type: 'string', example: 'VeilPay API is running' },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  @ApiOperation({
    summary: 'Get legacy health metadata',
    description:
      'Legacy JSON health endpoint retained for compatibility. It does not check PostgreSQL or RPC readiness.',
  })
  @ApiOkResponse({ type: LegacyHealthResponseDto })
  getHealth(): { status: string; service: string } {
    return this.appService.getHealth();
  }

  @Get('demo/company')
  @Public()
  @ApiOperation({
    summary: 'Get the shared company example',
    description:
      'Returns a static, non-production sample of the shared Company type.',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['id', 'name', 'status', 'createdAt', 'updatedAt'],
      properties: {
        id: { type: 'string', example: 'cmp_demo' },
        name: { type: 'string', example: 'VeilPay Demo Co' },
        status: { type: 'string', example: 'active' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  getSampleCompany() {
    return this.appService.getSampleCompany();
  }
}
