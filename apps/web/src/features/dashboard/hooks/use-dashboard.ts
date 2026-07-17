'use client';

import { getDashboardStats } from '@/features/dashboard/services/getDashboardStats';
import { useApiQuery } from '@/hooks/useApiQuery';

export const dashboardQueryKey = ['dashboard', 'stats'] as const;

export function useDashboardStats() {
  return useApiQuery({
    queryKey: dashboardQueryKey,
    queryFn: getDashboardStats,
  });
}
