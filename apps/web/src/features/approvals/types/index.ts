export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  title: string;
  requester: string;
  type: 'payroll' | 'compensation' | 'access';
  status: ApprovalStatus;
  createdAt: string;
  summary: string;
}
