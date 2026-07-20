'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontalIcon, WalletIcon } from 'lucide-react';
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
import { usePayrollRuns } from '@/features/payroll/hooks/use-payroll-runs';
import type { PayrollRun } from '@/features/payroll/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const columns: ColumnDef<PayrollRun>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Run" />
    ),
    accessorFn: (row) => row.name ?? row.periodLabel,
    cell: ({ row }) => (
      <div className="min-w-[160px] space-y-0.5">
        <Link
          href={`${ROUTES.payroll}/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.name ?? row.original.periodLabel}
        </Link>
        <div className="text-xs text-muted-foreground">
          {row.original.periodLabel}
        </div>
      </div>
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
    accessorKey: 'employeeCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Employees" />
    ),
    cell: ({ row }) => row.original.employeeCount,
  },
  {
    accessorKey: 'totalAmount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Net total" />
    ),
    cell: ({ row }) =>
      formatCurrency(row.original.totalAmount, row.original.currency),
  },
  {
    accessorKey: 'scheduledAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pay date" />
    ),
    cell: ({ row }) => formatDate(row.original.scheduledAt),
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
            render={<Link href={`${ROUTES.payroll}/${row.original.id}`} />}
            nativeButton={false}
          >
            Open run
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function PayrollRunsList() {
  const query = usePayrollRuns();

  return (
    <QueryState
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => query.refetch()}
      isEmpty={!query.data?.length}
      emptyIcon={WalletIcon}
      emptyTitle="No payroll runs"
      emptyDescription="Create a payroll cycle to process confidential compensation."
      loadingVariant="table"
    >
      <DataTable
        columns={columns}
        data={query.data ?? []}
        filterColumn="name"
        filterPlaceholder="Search payroll runs…"
        getRowId={(row) => row.id}
        pageSize={10}
      />
    </QueryState>
  );
}
