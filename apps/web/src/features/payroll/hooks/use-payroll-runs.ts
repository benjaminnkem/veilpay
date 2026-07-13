'use client';

import { getPayrollRuns } from '@/features/payroll/services/getPayrollRuns';
import { useApiQuery } from '@/hooks/useApiQuery';

export const payrollRunsQueryKey = ['payroll', 'runs'] as const;

export function usePayrollRuns() {
  return useApiQuery({
    queryKey: payrollRunsQueryKey,
    queryFn: getPayrollRuns,
  });
}
