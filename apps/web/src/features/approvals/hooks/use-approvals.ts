'use client';

import { getApprovals } from '@/features/approvals/services/getApprovals';
import { useApiQuery } from '@/hooks/useApiQuery';

export const approvalsQueryKey = ['approvals'] as const;

export function useApprovals() {
  return useApiQuery({
    queryKey: approvalsQueryKey,
    queryFn: getApprovals,
  });
}
