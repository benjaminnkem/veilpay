import { apiGet } from '@/lib/api';
import type { ApprovalRequest } from '@/features/approvals/types';

const DEMO_APPROVALS: ApprovalRequest[] = [
  {
    id: 'apr_1',
    title: 'March payroll release',
    requester: 'Sam Okoye',
    type: 'payroll',
    status: 'pending',
    createdAt: '2026-03-24T10:00:00.000Z',
    summary: 'Release encrypted payroll batch for 128 employees.',
  },
  {
    id: 'apr_2',
    title: 'Compensation band update',
    requester: 'Riley Chen',
    type: 'compensation',
    status: 'pending',
    createdAt: '2026-03-22T14:30:00.000Z',
    summary: 'Promote 4 engineers to L5 compensation band.',
  },
  {
    id: 'apr_3',
    title: 'Audit export access',
    requester: 'Jordan Lee',
    type: 'access',
    status: 'approved',
    createdAt: '2026-03-18T09:15:00.000Z',
    summary: 'Grant temporary access to encrypted audit exports.',
  },
];

export async function getApprovals(): Promise<ApprovalRequest[]> {
  try {
    return await apiGet<ApprovalRequest[]>('/approvals');
  } catch {
    return DEMO_APPROVALS;
  }
}
