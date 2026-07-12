'use client';

import { getEmployees } from '@/features/employees/services/getEmployees';
import { useApiQuery } from '@/hooks/useApiQuery';
import type { PaginationParams } from '@/types/api';

export const employeesQueryKey = ['employees'] as const;

export function useEmployees(params?: PaginationParams) {
  return useApiQuery({
    queryKey: [...employeesQueryKey, params] as const,
    queryFn: () => getEmployees(params),
  });
}
