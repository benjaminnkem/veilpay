import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared';
import { AuditLogsTable } from '@/features/audit-logs/components/audit-logs-table';

export const metadata: Metadata = {
  title: 'Audit logs',
  description: 'Inspect security-relevant activity across VeilPay.',
};

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit logs"
        description="Track sensitive actions across payroll, approvals, and access control."
      />
      <AuditLogsTable />
    </div>
  );
}
