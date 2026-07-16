import type {
  ExecutePayrollPaymentRequest,
  ExecutePayrollPaymentResult,
  PaymentProviderKind,
} from '@repo/types';

/**
 * Payment rail abstraction.
 * Payroll domain never depends on blockchain / bank / Stripe details.
 * Blockchain (Safe, Nox, USDC) will implement this interface later.
 */
export interface PaymentProvider {
  readonly kind: PaymentProviderKind;
  executePayroll(
    request: ExecutePayrollPaymentRequest,
  ): Promise<ExecutePayrollPaymentResult>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
