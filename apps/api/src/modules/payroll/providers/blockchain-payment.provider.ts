import { Injectable, Logger } from '@nestjs/common';
import type {
  ExecutePayrollPaymentRequest,
  ExecutePayrollPaymentResult,
} from '@repo/types';
import type { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class BlockchainPaymentProvider implements PaymentProvider {
  readonly kind = 'blockchain' as const;
  private readonly logger = new Logger(BlockchainPaymentProvider.name);

  async executePayroll(
    request: ExecutePayrollPaymentRequest,
  ): Promise<ExecutePayrollPaymentResult> {
    this.logger.log(
      `Blockchain provider stub for payroll ${request.payrollId} - Safe/Nox not wired yet`,
    );

    return {
      success: true,
      status: 'BLOCKCHAIN_PENDING',
      message:
        'Blockchain integration will be completed using Safe SDK and Nox Protocol.',
      provider: this.kind,
      transactionHash: null,
      externalReference: `chain_pending_${request.payrollId}_${Date.now()}`,
      processedAt: new Date().toISOString(),
      failures: [],
    };
  }
}
