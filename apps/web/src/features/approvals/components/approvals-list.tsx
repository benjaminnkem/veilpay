'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ClipboardCheckIcon } from 'lucide-react';
import Link from 'next/link';

import { QueryState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { approvalsQueryKey, useApprovals } from '@/features/approvals/hooks/use-approvals';
import {
  approveStep,
  rejectStep,
} from '@/features/approvals/services/getApprovals';
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
      loadingVariant="cards"
    >
      <div className="space-y-3">
        {query.data?.map((item) => {
          const status = String(item.status).toLowerCase();
          return (
            <Card key={item.id} className="border-border/60">
              <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>
                    {item.requester !== '—'
                      ? `Requested by ${item.requester} · `
                      : ''}
                    {formatDate(item.createdAt)}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize">
                    {item.type}
                  </Badge>
                  <Badge
                    variant={
                      status === 'approved'
                        ? 'default'
                        : status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className="capitalize"
                  >
                    {status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <p>{item.summary}</p>
                <div className="flex gap-2">
                  {item.payrollId ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      nativeButton={false}
                      render={
                        <Link href={`${ROUTES.payroll}/${item.payrollId}`} />
                      }
                    >
                      View payroll
                    </Button>
                  ) : null}
                  {status === 'pending' ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={reject.isPending}
                        onClick={() => reject.mutate(item.id)}
                      >
                        Reject
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={approve.isPending}
                        onClick={() => approve.mutate(item.id)}
                      >
                        Approve
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </QueryState>
  );
}
