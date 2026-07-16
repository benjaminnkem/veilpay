import { authGet, authPost } from '@/lib/api';
import type {
  ApprovalRequest,
  ApprovalTimeline,
} from '@/features/approvals/types';
import type { PaginatedResponse, PaginationParams } from '@/types/api';

export async function getApprovals(
  params?: PaginationParams
): Promise<ApprovalRequest[]> {
  const result = await authGet<PaginatedResponse<ApprovalRequest>>(
    '/approvals',
    { params }
  );
  return result.data;
}

export async function getApprovalTimeline(
  payrollId: string
): Promise<ApprovalTimeline> {
  return authGet<ApprovalTimeline>(`/approvals/payroll/${payrollId}`);
}

export async function approveStep(
  id: string,
  comments?: string
): Promise<unknown> {
  return authPost(`/approvals/${id}/approve`, { comments });
}

export async function rejectStep(
  id: string,
  comments?: string
): Promise<unknown> {
  return authPost(`/approvals/${id}/reject`, { comments });
}
