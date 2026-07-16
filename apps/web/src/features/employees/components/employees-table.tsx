'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { UsersIcon } from 'lucide-react';
import Link from 'next/link';

import { QueryState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ROUTES } from '@/constants/routes';
import { useEmployees } from '@/features/employees/hooks/use-employees';
import type { Employee } from '@/features/employees/types';
import { formatDate } from '@/lib/utils';

function statusVariant(
  status: string
): 'default' | 'secondary' | 'outline' | 'destructive' {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return 'default';
  if (s === 'ONBOARDING' || s === 'ON_LEAVE') return 'secondary';
  if (s === 'TERMINATED') return 'destructive';
  return 'outline';
}

const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: 'name',
    header: 'Employee',
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <Link
          href={`${ROUTES.employees}/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.firstName} {row.original.lastName}
        </Link>
        <div className="text-muted-foreground">{row.original.email}</div>
      </div>
    ),
  },
  {
    accessorKey: 'department',
    header: 'Department',
    cell: ({ row }) => row.original.department ?? '—',
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) =>
      row.original.position ?? row.original.title ?? '—',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = String(row.original.status);
      return (
        <Badge variant={statusVariant(status)} className="capitalize">
          {status.replaceAll('_', ' ').toLowerCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'hireDate',
    header: 'Hire date',
    cell: ({ row }) =>
      row.original.hireDate ? formatDate(row.original.hireDate) : '—',
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
      />
    </QueryState>
  );
}
