import { Injectable, Logger } from '@nestjs/common';
import type {
  ExecutePayrollPaymentRequest,
  ExecutePayrollPaymentResult,
} from '@repo/types';
import type { PaymentProvider } from './payment-provider.interface';

/**
 * Development / pre-blockchain payment provider.
 * Marks payroll as "executed" without moving funds.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly kind = 'mock' as const;
  private readonly logger = new Logger(MockPaymentProvider.name);

  async executePayroll(
    request: ExecutePayrollPaymentRequest,
  ): Promise<ExecutePayrollPaymentResult> {
    this.logger.log(
      `Mock payment for payroll ${request.payrollId} (${request.items.length} items)`,
    );

    // Intentionally empty implementation — real execution comes later
    return {
      success: true,
      provider: this.kind,
      transactionHash: null,
      externalReference: `mock_${request.payrollId}_${Date.now()}`,
      processedAt: new Date().toISOString(),
      failures: [],
    };
  }
}
