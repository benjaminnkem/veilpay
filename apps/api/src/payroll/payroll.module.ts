import { Module } from '@nestjs/common';
import { PayrollController } from './payroll.controller';
import { ManifestService } from './manifest.service';
import { PayrollService } from './payroll.service';
import { PayrollStateService } from './payroll-state.service';
@Module({
  controllers: [PayrollController],
  providers: [PayrollService, ManifestService, PayrollStateService],
  exports: [PayrollService, ManifestService, PayrollStateService],
})
export class PayrollModule {}
