import type { Metadata } from 'next';

import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'Analytics overview of your confidential payroll workspace — headcount, payroll trends, and treasury status.',
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
