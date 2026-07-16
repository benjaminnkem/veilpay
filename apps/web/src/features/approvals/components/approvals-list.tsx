'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useQueryClient } from '@tanstack/react-query';
import { ClipboardCheckIcon } from 'lucide-react';
import Link from 'next/link';

import { QueryState, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { ROUTES } from '@/constants/routes';
import {
  approvalsQueryKey,
  useApprovals,
} from '@/features/approvals/hooks/use-approvals';
import {
  approveStep,
  rejectStep,
} from '@/features/approvals/services/getApprovals';
import type { ApprovalRequest } from '@/features/approvals/types';
import { useApiMutation } from '@/hooks/useApiMutation';
import { formatDate } from '@/lib/utils';
import { notify } from '@/lib/toast';

export function ApprovalsList() {
  const query = useApprovals();
  const qc = useQueryClient();

  const approve = useApiMutation({
    mutationFn: (id: string) => approveStep(id),
    onSuccess: async () => {
      notify.success('Approved', 'Approval step recorded.');
      await qc.invalidateQueries({ queryKey: approvalsQueryKey });
    },
    onError: (e) => notify.error(e),
  });

  const reject = useApiMutation({
    mutationFn: (id: string) => rejectStep(id),
    onSuccess: async () => {
      notify.success('Rejected', 'Payroll returned to draft.');
      await qc.invalidateQueries({ queryKey: approvalsQueryKey });
    },
    onError: (e) => notify.error(e),
  });

  const columns: ColumnDef<ApprovalRequest>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Request" />
      ),
      cell: ({ row }) => (
        <div className="min-w-[180px] space-y-0.5">
          <p className="font-medium">{row.original.title}</p>
          <p className="text-xs text-muted-foreground">{row.original.summary}</p>
        </div>
      ),
    },
    {
      accessorKey: 'level',
      header: 'Level',
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.level ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <span className="capitalize text-sm">{row.original.type}</span>
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
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const status = String(row.original.status).toLowerCase();
        return (
          <div className="flex items-center justify-end gap-2">
            {row.original.payrollId ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                nativeButton={false}
                render={
                  <Link href={`${ROUTES.payroll}/${row.original.payrollId}`} />
                }
              >
                View
              </Button>
            ) : null}
            {status === 'pending' ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={reject.isPending}
                  onClick={() => reject.mutate(row.original.id)}
                >
                  Reject
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={approve.isPending}
                  onClick={() => approve.mutate(row.original.id)}
                >
                  Approve
                </Button>
              </>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <QueryState
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => query.refetch()}
      isEmpty={!query.data?.length}
      emptyIcon={ClipboardCheckIcon}
      emptyTitle="No approvals"
      emptyDescription="Approval requests will appear here when teammates submit them."
      loadingVariant="table"
    >
      <DataTable
        columns={columns}
        data={query.data ?? []}
        filterColumn="title"
        filterPlaceholder="Search approvals…"
        getRowId={(row) => row.id}
        pageSize={10}
      />
    </QueryState>
  );
}
