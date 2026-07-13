import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { EmployeesTable } from '@/features/employees/components/employees-table';

export const metadata: Metadata = {
  title: 'Employees',
  description: 'Manage employee records for confidential payroll.',
};

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Maintain your workforce directory and compensation metadata."
        actions={<Button type="button">Add employee</Button>}
      />
      <EmployeesTable />
    </div>
  );
}
