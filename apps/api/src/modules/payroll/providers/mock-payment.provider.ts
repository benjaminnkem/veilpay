import { Injectable, Logger } from '@nestjs/common';
import type {
  ExecutePayrollPaymentRequest,
  ExecutePayrollPaymentResult,
} from '@repo/types';
import type { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly kind = 'mock' as const;
  private readonly logger = new Logger(MockPaymentProvider.name);

  async executePayroll(
    request: ExecutePayrollPaymentRequest,
  ): Promise<ExecutePayrollPaymentResult> {
    this.logger.log(
      `Mock payment rail for payroll ${request.payrollId} (${request.items.length} items)`,
    );

    return {
      success: true,
      status: 'BLOCKCHAIN_PENDING',
      message:
        'Blockchain integration will be completed using Safe SDK and Nox Protocol.',
      provider: this.kind,
      transactionHash: null,
      externalReference: `pending_${request.payrollId}_${Date.now()}`,
      processedAt: new Date().toISOString(),
      failures: [],
    };
  }
}
