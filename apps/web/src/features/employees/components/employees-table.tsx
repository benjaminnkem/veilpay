'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontalIcon, UsersIcon } from 'lucide-react';
import Link from 'next/link';

import { QueryState, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/constants/routes';
import { useEmployees } from '@/features/employees/hooks/use-employees';
import type { Employee } from '@/features/employees/types';
import { formatDate } from '@/lib/utils';

const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Employee" />
    ),
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    cell: ({ row }) => (
      <div className="min-w-[180px] space-y-0.5">
        <Link
          href={`${ROUTES.employees}/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.firstName} {row.original.lastName}
        </Link>
        <div className="text-xs text-muted-foreground">{row.original.email}</div>
      </div>
    ),
  },
  {
    accessorKey: 'department',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Department" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.original.department ?? '—'}</span>
    ),
  },
  {
    id: 'role',
    accessorFn: (row) => row.position ?? row.title ?? '',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.position ?? row.original.title ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusBadge status={String(row.original.status)} />,
  },
  {
    accessorKey: 'hireDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Hire date" />
    ),
    cell: ({ row }) =>
      row.original.hireDate ? formatDate(row.original.hireDate) : '—',
  },
  {
    accessorKey: 'walletAddress',
    header: 'Wallet',
    cell: ({ row }) =>
      row.original.walletAddress ? (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.walletAddress.slice(0, 6)}…
          {row.original.walletAddress.slice(-4)}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Open row actions"
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            render={<Link href={`${ROUTES.employees}/${row.original.id}`} />}
            nativeButton={false}
          >
            View details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function EmployeesTable() {
  const query = useEmployees({ pageSize: 100 });

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
        filterPlaceholder="Search employees…"
        getRowId={(row) => row.id}
        pageSize={10}
      />
    </QueryState>
  );
}
