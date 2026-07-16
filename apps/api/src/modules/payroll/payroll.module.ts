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
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { BlockchainPaymentProvider } from './providers/blockchain-payment.provider';

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
    {
      provide: PAYMENT_PROVIDER,
      useExisting: MockPaymentProvider,
    },
  ],
  exports: [PayrollService],
})
export class PayrollModule {}
