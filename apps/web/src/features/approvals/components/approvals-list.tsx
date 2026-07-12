'use client';

import { ClipboardCheckIcon } from 'lucide-react';

import { QueryState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useApprovals } from '@/features/approvals/hooks/use-approvals';
import { formatDate } from '@/lib/utils';

export function ApprovalsList() {
  const query = useApprovals();

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
        {query.data?.map((item) => (
          <Card key={item.id} className="border-border/60">
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription>
                  Requested by {item.requester} · {formatDate(item.createdAt)}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="capitalize">
                  {item.type}
                </Badge>
                <Badge
                  variant={
                    item.status === 'approved'
                      ? 'default'
                      : item.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                  }
                  className="capitalize"
                >
                  {item.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {item.summary}
            </CardContent>
          </Card>
        ))}
      </div>
    </QueryState>
  );
}
