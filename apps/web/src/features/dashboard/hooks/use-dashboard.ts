'use client';

import { getDashboardStats } from '@/features/dashboard/services/getDashboardStats';
import { useApiQuery } from '@/hooks/useApiQuery';

export const dashboardQueryKey = ['dashboard', 'stats'] as const;

export function useDashboardStats(options?: { enabled?: boolean }) {
  return useApiQuery({
    queryKey: dashboardQueryKey,
    queryFn: getDashboardStats,
    enabled: options?.enabled ?? true,
  });
}
