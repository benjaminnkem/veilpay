import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared';
import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of your confidential payroll workspace.',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Monitor payroll health, approvals, and confidential operations."
      />
      <DashboardOverview />
    </div>
  );
}
