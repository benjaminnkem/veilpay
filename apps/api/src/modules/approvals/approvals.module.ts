import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ApprovalEntity,
  OrganizationSettingsEntity,
  PayrollEntity,
  UserEntity,
} from '../../database/entities';
import { PayrollModule } from '../payroll/payroll.module';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApprovalEntity,
      OrganizationSettingsEntity,
      PayrollEntity,
      UserEntity,
    ]),
    forwardRef(() => PayrollModule),
  ],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
