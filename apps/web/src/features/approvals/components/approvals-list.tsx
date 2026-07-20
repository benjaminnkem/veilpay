'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useQueryClient } from '@tanstack/react-query';
import { ClipboardCheckIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { QueryState, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
import { cn } from '@/lib/utils';

type BoardColumn = 'pending' | 'approved' | 'rejected';

export function ApprovalsList() {
  const query = useApprovals();
  const qc = useQueryClient();
  const [view, setView] = useState<'board' | 'table'>('board');
  const [action, setAction] = useState<{
    id: string;
    type: 'approve' | 'reject';
    title: string;
  } | null>(null);
  const [comments, setComments] = useState('');

  const approve = useApiMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      approveStep(id, comments),
    onSuccess: async () => {
      notify.success('Approved', 'Approval step recorded.');
      await qc.invalidateQueries({ queryKey: approvalsQueryKey });
      await qc.invalidateQueries({ queryKey: ['dashboard'] });
      setAction(null);
      setComments('');
    },
    onError: (e) => notify.error(e),
  });

  const reject = useApiMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      rejectStep(id, comments),
    onSuccess: async () => {
      notify.success('Rejected', 'Payroll marked rejected.');
      await qc.invalidateQueries({ queryKey: approvalsQueryKey });
      await qc.invalidateQueries({ queryKey: ['dashboard'] });
      setAction(null);
      setComments('');
    },
    onError: (e) => notify.error(e),
  });

  const rows = query.data ?? [];

  const columns = useMemo<ColumnDef<ApprovalRequest>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Request" />
        ),
        cell: ({ row }) => (
          <div className="min-w-[180px] space-y-0.5">
            <p className="font-medium">{row.original.title}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.summary}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'level',
        header: 'Level',
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.level ?? '-'}
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
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created" />
        ),
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            onApprove={() =>
              setAction({
                id: row.original.id,
                type: 'approve',
                title: row.original.title,
              })
            }
            onReject={() =>
              setAction({
                id: row.original.id,
                type: 'reject',
                title: row.original.title,
              })
            }
          />
        ),
      },
    ],
    []
  );

  const board: Record<BoardColumn, ApprovalRequest[]> = {
    pending: rows.filter(
      (r) => String(r.status).toUpperCase() === 'PENDING'
    ),
    approved: rows.filter(
      (r) => String(r.status).toUpperCase() === 'APPROVED'
    ),
    rejected: rows.filter(
      (r) => String(r.status).toUpperCase() === 'REJECTED'
    ),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Sequential payroll approvals for your role.
        </p>
        <div className="flex gap-1 rounded-lg border border-border/70 p-1">
          <Button
            size="sm"
            variant={view === 'board' ? 'secondary' : 'ghost'}
            onClick={() => setView('board')}
          >
            Board
          </Button>
          <Button
            size="sm"
            variant={view === 'table' ? 'secondary' : 'ghost'}
            onClick={() => setView('table')}
          >
            Table
          </Button>
        </div>
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        isEmpty={!rows.length}
        emptyIcon={ClipboardCheckIcon}
        emptyTitle="No approval requests"
        emptyDescription="When payroll is submitted, steps appear here for HR, Finance, and CEO."
      >
        {view === 'board' ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {(
              [
                ['pending', 'Pending'],
                ['approved', 'Approved'],
                ['rejected', 'Rejected'],
              ] as const
            ).map(([key, label]) => (
              <Card key={key} className="border-border/70">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    {label}
                    <span className="ml-2 text-muted-foreground">
                      {board[key].length}
                    </span>
                  </CardTitle>
                  <CardDescription className="sr-only">{label} column</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {board[key].length === 0 ? (
                    <p className="text-xs text-muted-foreground">Empty</p>
                  ) : (
                    board[key].map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border/70 bg-card p-3 shadow-sm"
                      >
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {item.level ?? '-'} · {item.summary}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.payrollId ? (
                            <Button
                              size="sm"
                              variant="outline"
                              nativeButton={false}
                              render={
                                <Link
                                  href={`${ROUTES.payroll}/${item.payrollId}`}
                                />
                              }
                            >
                              View
                            </Button>
                          ) : null}
                          {String(item.status).toUpperCase() === 'PENDING' ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setAction({
                                    id: item.id,
                                    type: 'reject',
                                    title: item.title,
                                  })
                                }
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  setAction({
                                    id: item.id,
                                    type: 'approve',
                                    title: item.title,
                                  })
                                }
                              >
                                Approve
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            filterColumn="title"
            filterPlaceholder="Filter requests…"
          />
        )}
      </QueryState>

      <Dialog
        open={!!action}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
            setComments('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action?.type === 'approve' ? 'Approve' : 'Reject'} request
            </DialogTitle>
            <DialogDescription>{action?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="approval-comments">
              Comment {action?.type === 'reject' ? '(recommended)' : '(optional)'}
            </label>
            <Textarea
              id="approval-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                action?.type === 'approve'
                  ? 'Looks good for this period…'
                  : 'Reason for rejection…'
              }
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAction(null);
                setComments('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={action?.type === 'reject' ? 'destructive' : 'default'}
              disabled={approve.isPending || reject.isPending}
              onClick={() => {
                if (!action) return;
                const payload = {
                  id: action.id,
                  comments: comments.trim() || undefined,
                };
                if (action.type === 'approve') approve.mutate(payload);
                else reject.mutate(payload);
              }}
            >
              {action?.type === 'approve' ? 'Confirm approve' : 'Confirm reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RowActions({
  row,
  onApprove,
  onReject,
}: {
  row: ApprovalRequest;
  onApprove: () => void;
  onReject: () => void;
}) {
  const status = String(row.status).toLowerCase();
  return (
    <div className={cn('flex items-center justify-end gap-2')}>
      {row.payrollId ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link href={`${ROUTES.payroll}/${row.payrollId}`} />}
        >
          View
        </Button>
      ) : null}
      {status === 'pending' ? (
        <>
          <Button type="button" size="sm" variant="outline" onClick={onReject}>
            Reject
          </Button>
          <Button type="button" size="sm" onClick={onApprove}>
            Approve
          </Button>
        </>
      ) : null}
    </div>
  );
}
