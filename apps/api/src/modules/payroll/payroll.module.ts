import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EmployeeEntity,
  OrganizationEntity,
  PayrollEntity,
  PayrollItemEntity,
} from '../../database/entities';
import { CompensationModule } from '../compensation/compensation.module';
import { ApprovalsModule } from '../approvals/approvals.module';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { BlockchainPaymentProvider } from './providers/blockchain-payment.provider';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { PaymentExecutionService } from './providers/payment-execution.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayrollEntity,
      PayrollItemEntity,
      EmployeeEntity,
      OrganizationEntity,
    ]),
    CompensationModule,
    forwardRef(() => ApprovalsModule),
  ],
  controllers: [PayrollController],
  providers: [
    PayrollService,
    MockPaymentProvider,
    BlockchainPaymentProvider,
    PaymentExecutionService,
  ],
  exports: [PayrollService, PaymentExecutionService],
})
export class PayrollModule {}
