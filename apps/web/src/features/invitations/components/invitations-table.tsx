'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MailPlusIcon } from 'lucide-react';

import { QueryState, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
  useInvitations,
  useRevokeInvitation,
} from '@/features/invitations/hooks/use-invitations';
import type { Invitation } from '@/features/invitations/services/invitations';
import { formatCurrency, formatDate } from '@/lib/utils';
import { notify } from '@/lib/toast';

export function InvitationsTable() {
  const query = useInvitations();
  const revoke = useRevokeInvitation();

  const columns: ColumnDef<Invitation>[] = [
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invitee" />
      ),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="font-medium">{row.original.email}</p>
          <p className="text-xs text-muted-foreground">
            {[row.original.firstName, row.original.lastName]
              .filter(Boolean)
              .join(' ') || '-'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <span className="capitalize text-sm">
          {row.original.role.replaceAll('_', ' ').toLowerCase()}
        </span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <span className="capitalize text-sm">
          {row.original.type.toLowerCase()}
        </span>
      ),
    },
    {
      id: 'startingSalary',
      header: 'Starting salary',
      cell: ({ row }) => {
        const cents = row.original.startingSalaryCents;
        if (cents == null) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        return (
          <div className="space-y-0.5">
            <p className="text-sm font-medium">
              {formatCurrency(cents / 100, row.original.salaryCurrency ?? 'USD')}
            </p>
            <p className="text-xs capitalize text-muted-foreground">
              {(row.original.salaryFrequency ?? 'annually')
                .replaceAll('_', ' ')
                .toLowerCase()}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'expiresAt',
      header: 'Expires',
      cell: ({ row }) => formatDate(row.original.expiresAt),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const pending = row.original.status.toUpperCase() === 'PENDING';
        if (!pending) return null;
        return (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={revoke.isPending}
            onClick={async () => {
              try {
                await revoke.mutateAsync(row.original.id);
                notify.success('Invitation revoked');
              } catch (error) {
                notify.error(error);
              }
            }}
          >
            Revoke
          </Button>
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
      isEmpty={!query.data?.data.length}
      emptyIcon={MailPlusIcon}
      emptyTitle="No invitations"
      emptyDescription="Invite HR, Finance, CEO, or employees to your workspace."
      loadingVariant="table"
    >
      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        filterColumn="email"
        filterPlaceholder="Search invitations…"
        getRowId={(row) => row.id}
      />
    </QueryState>
  );
}
