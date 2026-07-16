import { Injectable, NotImplementedException } from '@nestjs/common';
import type {
  ExecutePayrollPaymentRequest,
  ExecutePayrollPaymentResult,
} from '@repo/types';
import type { PaymentProvider } from './payment-provider.interface';

/**
 * Placeholder for future Safe + Nox + confidential USDC execution.
 * Do not implement blockchain logic here yet.
 */
@Injectable()
export class BlockchainPaymentProvider implements PaymentProvider {
  readonly kind = 'blockchain' as const;

  async executePayroll(
    _request: ExecutePayrollPaymentRequest,
  ): Promise<ExecutePayrollPaymentResult> {
    throw new NotImplementedException(
      'Blockchain payment provider is not implemented yet. Use MockPaymentProvider until Safe/Nox integration lands.',
    );
  }
}
