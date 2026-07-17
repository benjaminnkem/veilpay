import type { PayrollStatus } from '@repo/types';

export type PayrollRunStatus = PayrollStatus | string;

export interface PayrollItem {
  id: string;
  payrollId: string;
  employeeId: string;
  employeeName: string;
  baseSalaryCents: number;
  bonusCents: number;
  allowanceCents: number;
  deductionsCents: number;
  netPayCents: number;
  currency: string;
  walletAddress: string | null;
  transactionHash: string | null;
  notes: string | null;
}

export interface PayrollRun {
  id: string;
  organizationId?: string;
  name?: string;
  periodLabel: string;
  periodStart?: string;
  periodEnd?: string;
  payDate?: string;
  status: PayrollRunStatus;
  employeeCount: number;
  totalAmount: number;
  totalNetPayCents?: number;
  totalBaseSalaryCents?: number;
  totalBonusCents?: number;
  totalAllowanceCents?: number;
  totalDeductionsCents?: number;
  currency: string;
  scheduledAt: string;
  confidential: boolean;
  notes?: string | null;
  transactionHash?: string | null;
  network?: string | null;
  executionProvider?: string | null;
  executionMessage?: string | null;
  items?: PayrollItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePayrollPayload {
  name: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  currency?: string;
  notes?: string;
  employeeIds?: string[];
}
