export type PayrollRunStatus =
  | 'draft'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface PayrollLineItem {
  employeeId: string;
  amountCents: number;
  currency: string;
  walletAddress?: string;
}

export interface PayrollRun {
  id: string;
  companyId: string;
  status: PayrollRunStatus;
  periodStart: string;
  periodEnd: string;
  lineItems: PayrollLineItem[];
  totalCents: number;
  currency: string;
  txHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayrollRunInput {
  companyId: string;
  periodStart: string;
  periodEnd: string;
  lineItems: PayrollLineItem[];
  currency?: string;
}
