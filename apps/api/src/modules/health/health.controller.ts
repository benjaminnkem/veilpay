import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check' })
  check() {
    return {
      status: 'ok',
      service: 'veilpay-api',
      timestamp: new Date().toISOString(),
    };
  }
}
