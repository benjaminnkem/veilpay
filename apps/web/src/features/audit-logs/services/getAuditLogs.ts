import { apiGet } from '@/lib/api';
import type { AuditLog } from '@/features/audit-logs/types';
import type { PaginatedResponse, PaginationParams } from '@/types/api';

export async function getAuditLogs(
  params?: PaginationParams & {
    action?: string;
    entityType?: string;
  }
): Promise<PaginatedResponse<AuditLog> | AuditLog[]> {
  return apiGet<PaginatedResponse<AuditLog>>('/audit-logs', { params });
}
