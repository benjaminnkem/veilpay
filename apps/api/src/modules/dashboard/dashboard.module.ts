import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ApprovalEntity,
  AuditLogEntity,
  EmployeeEntity,
  OrganizationEntity,
  PayrollEntity,
} from '../../database/entities';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeEntity,
      PayrollEntity,
      ApprovalEntity,
      AuditLogEntity,
      OrganizationEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
