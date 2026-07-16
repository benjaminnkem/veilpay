import type { AuditAction } from './enums.js';
import type { PaginationQuery, Timestamps } from './common.js';

export interface AuditLog extends Timestamps {
  id: string;
  organizationId: string | null;
  actorId: string | null;
  actorEmail: string | null;
  action: AuditAction | string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuditLogQuery extends PaginationQuery {
  action?: string;
  entityType?: string;
  actorId?: string;
  from?: string;
  to?: string;
}
