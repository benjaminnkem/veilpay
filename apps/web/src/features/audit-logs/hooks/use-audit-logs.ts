'use client';

import { getAuditLogs } from '@/features/audit-logs/services/getAuditLogs';
import type { AuditLog } from '@/features/audit-logs/types';
import type { PaginatedResponse } from '@/types/api';
import { useApiQuery } from '@/hooks/useApiQuery';

export const auditLogsQueryKey = ['audit-logs'] as const;

function normalize(
  result: PaginatedResponse<AuditLog> | AuditLog[]
): AuditLog[] {
  const rows = Array.isArray(result) ? result : result.data;
  return rows.map((row) => ({
    ...row,
    actor: row.actorEmail ?? row.actor ?? 'System',
    resource: row.entityType ?? row.resource ?? '-',
    ipAddress: row.ipAddress ?? '-',
    metadata:
      typeof row.metadata === 'object' && row.metadata !== null
        ? JSON.stringify(row.metadata)
        : (row.metadata ?? undefined),
  }));
}

export function useAuditLogs() {
  return useApiQuery({
    queryKey: auditLogsQueryKey,
    queryFn: async () => normalize(await getAuditLogs()),
  });
}
