import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { PayrollRunsList } from '@/features/payroll/components/payroll-runs-list';

export const metadata: Metadata = {
  title: 'Payroll',
  description: 'Create and review confidential payroll runs.',
};

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Schedule encrypted payroll cycles and track release status."
        actions={<Button type="button">New payroll run</Button>}
      />
      <PayrollRunsList />
    </div>
  );
}
