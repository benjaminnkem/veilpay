import { apiGet, apiPost } from '@/lib/api';
import type {
  ApprovalRequest,
  ApprovalTimeline,
} from '@/features/approvals/types';
import type { PaginatedResponse, PaginationParams } from '@/types/api';

export async function getApprovals(
  params?: PaginationParams
): Promise<ApprovalRequest[]> {
  const result = await apiGet<PaginatedResponse<ApprovalRequest>>(
    '/approvals',
    { params }
  );
  return result.data;
}

export async function getApprovalTimeline(
  payrollId: string
): Promise<ApprovalTimeline> {
  return apiGet<ApprovalTimeline>(`/approvals/payroll/${payrollId}`);
}

export async function approveStep(
  id: string,
  comments?: string
): Promise<unknown> {
  return apiPost(`/approvals/${id}/approve`, { comments });
}

export async function rejectStep(
  id: string,
  comments?: string
): Promise<unknown> {
  return apiPost(`/approvals/${id}/reject`, { comments });
}
