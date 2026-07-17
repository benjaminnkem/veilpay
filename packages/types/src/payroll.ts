import type { ApprovalStatus, PayrollStatus } from './enums.js';
import type { PaginationQuery, Timestamps } from './common.js';

export interface PayrollItem extends Timestamps {
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

  // Placeholder for future on-chain settlement
  transactionHash: string | null;
  notes: string | null;
}

export interface Payroll extends Timestamps {
  id: string;
  organizationId: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  status: PayrollStatus;
  employeeCount: number;
  totalBaseSalaryCents: number;
  totalBonusCents: number;
  totalAllowanceCents: number;
  totalDeductionsCents: number;
  totalNetPayCents: number;
  currency: string;
  notes: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  executedAt: string | null;
  transactionHash: string | null;
  network: string | null;
  executionProvider: string | null;
  executionMessage: string | null;
  createdById: string;
  items?: PayrollItem[];
}

export interface CreatePayrollInput {
  name: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  currency?: string;
  notes?: string;
  employeeIds?: string[];
}

export interface UpdatePayrollInput {
  name?: string;
  periodStart?: string;
  periodEnd?: string;
  payDate?: string;
  notes?: string | null;
}

export interface PayrollListQuery extends PaginationQuery {
  status?: PayrollStatus;
}

export interface UpdatePayrollItemInput {
  bonusCents?: number;
  allowanceCents?: number;
  deductionsCents?: number;
  notes?: string | null;
}

export interface PayrollPreview {
  payroll: Payroll;
  items: PayrollItem[];
}

export interface ApprovalStep extends Timestamps {
  id: string;
  payrollId: string;
  organizationId: string;
  level: string;
  sequence: number;
  status: ApprovalStatus;
  approverId: string | null;
  approverName: string | null;
  comments: string | null;
  actedAt: string | null;
}

export interface ApprovalActionInput {
  comments?: string;
}

export interface ApprovalTimeline {
  payrollId: string;
  currentLevel: string | null;
  overallStatus: ApprovalStatus | 'COMPLETED' | 'NOT_STARTED';
  steps: ApprovalStep[];
}
