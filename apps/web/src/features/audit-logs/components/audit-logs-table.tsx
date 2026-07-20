'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ScrollTextIcon } from 'lucide-react';

import { QueryState, StatusBadge } from '@/components/shared';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { useAuditLogs } from '@/features/audit-logs/hooks/use-audit-logs';
import type { AuditLog } from '@/features/audit-logs/types';
import { formatDate } from '@/lib/utils';

const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Timestamp" />
    ),
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Actor" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.original.actor ?? 'System'}</span>
    ),
  },
  {
    accessorKey: 'action',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Action" />
    ),
    cell: ({ row }) => (
      <StatusBadge status={String(row.original.action)} className="font-mono" />
    ),
  },
  {
    accessorKey: 'resource',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Resource" />
    ),
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <p className="text-sm">{row.original.resource ?? '-'}</p>
        {row.original.entityId ? (
          <p className="font-mono text-[11px] text-muted-foreground">
            {row.original.entityId}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: 'ipAddress',
    header: 'IP',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.ipAddress ?? '-'}
      </span>
    ),
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
        getRowId={(row) => row.id}
        pageSize={15}
      />
    </QueryState>
  );
}
