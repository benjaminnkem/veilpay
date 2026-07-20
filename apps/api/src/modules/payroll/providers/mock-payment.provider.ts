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
    const payable = request.items.filter((item) => item.amountCents > 0);
    const totalCents = payable.reduce((sum, item) => sum + item.amountCents, 0);
    this.logger.log(
      `Mock payment rail for payroll ${request.payrollId} (${payable.length} payable / ${request.items.length} items, $${(totalCents / 100).toFixed(2)})`,
    );

    return {
      success: true,
      status: 'BLOCKCHAIN_PENDING',
      message: `Mock rail staged ${payable.length} recipient batch totaling $${(totalCents / 100).toFixed(2)}. Switch organization execution provider to blockchain and fund the Safe for live multi-employee USDC settlement.`,
      provider: this.kind,
      transactionHash: null,
      externalReference: `pending_${request.payrollId}_${Date.now()}`,
      processedAt: new Date().toISOString(),
      failures: [],
    };
  }
}
