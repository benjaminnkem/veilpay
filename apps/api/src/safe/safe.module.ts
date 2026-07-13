import { Global, Module } from '@nestjs/common';
import { SafeController } from './safe.controller';
import { SafeService } from './safe.service';
@Global()
@Module({
  controllers: [SafeController],
  providers: [SafeService],
  exports: [SafeService],
})
export class SafeModule {}
