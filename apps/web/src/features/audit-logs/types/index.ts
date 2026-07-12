export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  resource: string;
  ipAddress: string;
  createdAt: string;
  metadata?: string;
}
