'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { UsersIcon } from 'lucide-react';

import { QueryState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { useEmployees } from '@/features/employees/hooks/use-employees';
import type { Employee } from '@/features/employees/types';
import { formatDate } from '@/lib/utils';

const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: 'name',
    header: 'Employee',
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <div className="font-medium">
          {row.original.firstName} {row.original.lastName}
        </div>
        <div className="text-muted-foreground">{row.original.email}</div>
      </div>
    ),
  },
  {
    accessorKey: 'department',
    header: 'Department',
  },
  {
    accessorKey: 'title',
    header: 'Title',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const variant =
        status === 'active'
          ? 'default'
          : status === 'onboarding'
            ? 'secondary'
            : 'outline';

      return (
        <Badge variant={variant} className="capitalize">
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'hireDate',
    header: 'Hire date',
    cell: ({ row }) => formatDate(row.original.hireDate),
  },
];

export function EmployeesTable() {
  const query = useEmployees();

  return (
    <QueryState
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => query.refetch()}
      isEmpty={!query.data?.data.length}
      emptyIcon={UsersIcon}
      emptyTitle="No employees yet"
      emptyDescription="Add your first employee to start confidential payroll runs."
      loadingVariant="table"
    >
      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        filterColumn="name"
        filterPlaceholder="Filter employees…"
        emptyMessage="No employees match your filters."
      />
    </QueryState>
  );
}
