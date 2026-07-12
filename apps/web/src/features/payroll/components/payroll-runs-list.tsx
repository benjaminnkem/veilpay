'use client';

import { WalletIcon } from 'lucide-react';

import { QueryState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePayrollRuns } from '@/features/payroll/hooks/use-payroll-runs';
import { formatCurrency, formatDate } from '@/lib/utils';

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
      loadingVariant="cards"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {query.data?.map((run) => (
          <Card key={run.id} className="border-border/60">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{run.periodLabel}</CardTitle>
                  <CardDescription>
                    Scheduled {formatDate(run.scheduledAt)}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {run.status.replaceAll('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Employees</span>
                <span className="font-medium">{run.employeeCount}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">
                  {formatCurrency(run.totalAmount, run.currency)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Confidential</span>
                <span className="font-medium">
                  {run.confidential ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </QueryState>
  );
}
