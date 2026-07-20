export interface AuditLog {
  id: string;
  organizationId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  /** @deprecated UI alias - prefer actorEmail */
  actor?: string;
  action: string;
  entityType?: string;
  entityId?: string | null;
  /** @deprecated UI alias - prefer entityType */
  resource?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | string | null;
  createdAt: string;
  updatedAt?: string;
}
