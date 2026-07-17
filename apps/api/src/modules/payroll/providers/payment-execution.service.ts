import { Injectable } from '@nestjs/common';
import type {
  ExecutePayrollPaymentRequest,
  ExecutePayrollPaymentResult,
} from '@repo/types';
import { BlockchainPaymentProvider } from './blockchain-payment.provider';
import { MockPaymentProvider } from './mock-payment.provider';
import type { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class PaymentExecutionService {
  constructor(
    private readonly mockProvider: MockPaymentProvider,
    private readonly blockchainProvider: BlockchainPaymentProvider,
  ) {}

  resolveProvider(kind?: string | null): PaymentProvider {
    if (kind === 'blockchain') {
      return this.blockchainProvider;
    }
    return this.mockProvider;
  }

  async executePayroll(
    request: ExecutePayrollPaymentRequest,
    providerKind?: string | null,
  ): Promise<ExecutePayrollPaymentResult> {
    const provider = this.resolveProvider(providerKind);
    return provider.executePayroll(request);
  }
}
