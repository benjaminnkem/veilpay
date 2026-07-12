'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ScrollTextIcon } from 'lucide-react';

import { QueryState } from '@/components/shared';
import { DataTable } from '@/components/ui/data-table';
import { useAuditLogs } from '@/features/audit-logs/hooks/use-audit-logs';
import type { AuditLog } from '@/features/audit-logs/types';
import { formatDate } from '@/lib/utils';

const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Timestamp',
    cell: ({ row }) =>
      formatDate(row.original.createdAt, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
  },
  {
    accessorKey: 'actor',
    header: 'Actor',
  },
  {
    accessorKey: 'action',
    header: 'Action',
  },
  {
    accessorKey: 'resource',
    header: 'Resource',
  },
  {
    accessorKey: 'ipAddress',
    header: 'IP',
  },
];

export function AuditLogsTable() {
  const query = useAuditLogs();

  return (
    <QueryState
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => query.refetch()}
      isEmpty={!query.data?.length}
      emptyIcon={ScrollTextIcon}
      emptyTitle="No audit events"
      emptyDescription="Security-relevant activity will appear in this log."
      loadingVariant="table"
    >
      <DataTable
        columns={columns}
        data={query.data ?? []}
        filterColumn="actor"
        filterPlaceholder="Filter by actor…"
        emptyMessage="No audit events match your filters."
      />
    </QueryState>
  );
}
