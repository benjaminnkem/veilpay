'use client';

import { getAuditLogs } from '@/features/audit-logs/services/getAuditLogs';
import { useApiQuery } from '@/hooks/useApiQuery';

export const auditLogsQueryKey = ['audit-logs'] as const;

export function useAuditLogs() {
  return useApiQuery({
    queryKey: auditLogsQueryKey,
    queryFn: getAuditLogs,
  });
}
