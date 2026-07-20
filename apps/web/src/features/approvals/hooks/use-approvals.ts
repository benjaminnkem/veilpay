'use client';

import { getApprovals } from '@/features/approvals/services/getApprovals';
import { useApiQuery } from '@/hooks/useApiQuery';

export const approvalsQueryKey = ['approvals'] as const;

export function useApprovals(options?: { enabled?: boolean }) {
  return useApiQuery({
    queryKey: approvalsQueryKey,
    queryFn: () => getApprovals(),
    enabled: options?.enabled ?? true,
  });
}
