import { apiGet } from '@/lib/api';
import type { AuditLog } from '@/features/audit-logs/types';

const DEMO_LOGS: AuditLog[] = [
  {
    id: 'log_1',
    actor: 'Alex Morgan',
    action: 'payroll.run.viewed',
    resource: 'pay_1',
    ipAddress: '203.0.113.10',
    createdAt: '2026-03-24T12:04:00.000Z',
    metadata: 'Viewed encrypted payroll summary',
  },
  {
    id: 'log_2',
    actor: 'Sam Okoye',
    action: 'approval.requested',
    resource: 'apr_1',
    ipAddress: '203.0.113.22',
    createdAt: '2026-03-24T10:00:00.000Z',
    metadata: 'Submitted March payroll for approval',
  },
  {
    id: 'log_3',
    actor: 'Jordan Lee',
    action: 'employee.updated',
    resource: 'emp_1',
    ipAddress: '198.51.100.8',
    createdAt: '2026-03-23T16:42:00.000Z',
    metadata: 'Updated employment title',
  },
];

export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    return await apiGet<AuditLog[]>('/audit-logs');
  } catch {
    return DEMO_LOGS;
  }
}
