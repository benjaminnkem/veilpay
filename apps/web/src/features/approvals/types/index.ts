export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | string;

export interface ApprovalRequest {
  id: string;
  title: string;
  requester: string;
  type: 'payroll' | 'compensation' | 'access' | string;
  status: ApprovalStatus;
  createdAt: string;
  summary: string;
  payrollId?: string;
  level?: string;
  sequence?: number;
  comments?: string | null;
}

export interface ApprovalStep {
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
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalTimeline {
  payrollId: string;
  currentLevel: string | null;
  overallStatus: string;
  steps: ApprovalStep[];
}
