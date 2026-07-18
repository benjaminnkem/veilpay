export type PaymentProviderKind = 'mock' | 'blockchain' | 'bank' | 'stripe';

export type PaymentExecutionStatus =
  | 'COMPLETED'
  | 'BLOCKCHAIN_PENDING'
  | 'FAILED';

export interface PayrollPaymentItem {
  employeeId: string;
  employeeName?: string | null;
  amountCents: number;
  currency: string;
  walletAddress?: string | null;
  bankAccountRef?: string | null;
}

export interface ExecutePayrollPaymentRequest {
  payrollId: string;
  organizationId: string;
  items: PayrollPaymentItem[];
  currency: string;
  safeAddress?: string | null;
  network?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ExecutePayrollPaymentResult {
  success: boolean;
  status: PaymentExecutionStatus;
  message: string | null;
  provider: PaymentProviderKind;
  transactionHash: string | null;
  externalReference: string | null;
  processedAt: string;
  failures: Array<{
    employeeId: string;
    reason: string;
  }>;
}

export interface PaymentProvider {
  readonly kind: PaymentProviderKind;
  executePayroll(
    request: ExecutePayrollPaymentRequest,
  ): Promise<ExecutePayrollPaymentResult>;
}
