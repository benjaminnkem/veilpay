export type PayrollRunStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'failed';

export interface PayrollRun {
  id: string;
  periodLabel: string;
  status: PayrollRunStatus;
  employeeCount: number;
  totalAmount: number;
  currency: string;
  scheduledAt: string;
  confidential: boolean;
}
