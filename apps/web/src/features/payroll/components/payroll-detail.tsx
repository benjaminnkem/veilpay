'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  BlocksIcon,
  ShieldAlertIcon,
  WalletIcon,
} from 'lucide-react';
import Link from 'next/link';

import { QueryState } from '@/components/shared';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROUTES } from '@/constants/routes';
import { getApprovalTimeline } from '@/features/approvals/services/getApprovals';
import {
  cancelPayroll,
  executePayroll,
  getPayroll,
  regeneratePayroll,
  submitPayroll,
} from '@/features/payroll/services/getPayrollRuns';
import { payrollRunsQueryKey } from '@/features/payroll/hooks/use-payroll-runs';
import { formatCurrency, formatDate } from '@/lib/utils';
import { notify } from '@/lib/toast';

export function PayrollDetail({ payrollId }: { payrollId: string }) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['payroll', payrollId],
    queryFn: () => getPayroll(payrollId),
  });

  const timelineQuery = useQuery({
    queryKey: ['approvals', 'timeline', payrollId],
    queryFn: () => getApprovalTimeline(payrollId),
  });

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['payroll', payrollId] });
    await qc.invalidateQueries({ queryKey: payrollRunsQueryKey });
    await qc.invalidateQueries({
      queryKey: ['approvals', 'timeline', payrollId],
    });
    await qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const submit = useMutation({
    mutationFn: () => submitPayroll(payrollId),
    onSuccess: async () => {
      notify.success('Submitted', 'Payroll is pending HR → Finance → CEO.');
      await invalidate();
    },
    onError: (e) => notify.error(e),
  });

  const execute = useMutation({
    mutationFn: () => executePayroll(payrollId),
    onSuccess: async (run) => {
      const status = String(run.status).toUpperCase();
      if (status === 'BLOCKCHAIN_PENDING') {
        notify.info(
          'Blockchain integration pending',
          run.executionMessage ??
            'Safe SDK and Nox Protocol execution will complete this step.'
        );
      } else {
        notify.success('Executed', 'Payroll processed via payment provider.');
      }
      await invalidate();
    },
    onError: (e) => notify.error(e),
  });

  const regenerate = useMutation({
    mutationFn: () => regeneratePayroll(payrollId),
    onSuccess: async () => {
      notify.success('Regenerated', 'Payroll items refreshed from compensation.');
      await invalidate();
    },
    onError: (e) => notify.error(e),
  });

  const cancel = useMutation({
    mutationFn: () => cancelPayroll(payrollId),
    onSuccess: async () => {
      notify.success('Cancelled', 'Payroll run was cancelled.');
      await invalidate();
    },
    onError: (e) => notify.error(e),
  });

  const payroll = query.data;
  const status = String(payroll?.status ?? '').toUpperCase();
  const canModify = status === 'DRAFT' || status === 'REJECTED';
  const canCancel = !['COMPLETED', 'PROCESSING', 'BLOCKCHAIN_PENDING'].includes(
    status
  );

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href={ROUTES.payroll} />}
      >
        <ArrowLeftIcon className="size-4" />
        Back to payroll
      </Button>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        isEmpty={!payroll}
        emptyIcon={WalletIcon}
        emptyTitle="Payroll not found"
        emptyDescription="This run may have been removed."
      >
        {payroll ? (
          <>
            <Card className="border-border/60">
              <CardHeader className="flex-row flex-wrap items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-xl">
                    {payroll.name ?? payroll.periodLabel}
                  </CardTitle>
                  <CardDescription>
                    {payroll.periodLabel} · pay date{' '}
                    {formatDate(payroll.payDate ?? payroll.scheduledAt)}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {String(payroll.status).replaceAll('_', ' ').toLowerCase()}
                  </Badge>
                  {canModify ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => regenerate.mutate()}
                        disabled={regenerate.isPending}
                      >
                        Regenerate
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => submit.mutate()}
                        disabled={submit.isPending}
                      >
                        Submit for approval
                      </Button>
                    </>
                  ) : null}
                  {status === 'APPROVED' ? (
                    <Button
                      size="sm"
                      onClick={() => execute.mutate()}
                      disabled={execute.isPending}
                    >
                      Execute payroll
                    </Button>
                  ) : null}
                  {canCancel && status !== 'CANCELLED' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancel.mutate()}
                      disabled={cancel.isPending}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <Stat
                  label="Employees"
                  value={String(payroll.employeeCount)}
                />
                <Stat
                  label="Net total"
                  value={formatCurrency(
                    payroll.totalAmount ??
                      (payroll.totalNetPayCents ?? 0) / 100,
                    payroll.currency
                  )}
                />
                <Stat
                  label="Base"
                  value={formatCurrency(
                    (payroll.totalBaseSalaryCents ?? 0) / 100,
                    payroll.currency
                  )}
                />
                <Stat
                  label="Deductions"
                  value={formatCurrency(
                    (payroll.totalDeductionsCents ?? 0) / 100,
                    payroll.currency
                  )}
                />
              </CardContent>
            </Card>

            {status === 'APPROVED' || status === 'BLOCKCHAIN_PENDING' ? (
              <Card className="border-primary/25 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BlocksIcon className="size-4 text-primary" />
                    Execution
                  </CardTitle>
                  <CardDescription>
                    Payment rails use the PaymentExecutionService abstraction.
                    Controllers never talk to blockchain SDKs directly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {status === 'APPROVED' ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Fully approved and ready for execution. Clicking Execute
                        payroll hands the run to the payment provider.
                      </p>
                      <Button
                        onClick={() => execute.mutate()}
                        disabled={execute.isPending}
                      >
                        {execute.isPending
                          ? 'Executing…'
                          : 'Execute payroll'}
                      </Button>
                    </>
                  ) : (
                    <Alert>
                      <ShieldAlertIcon />
                      <AlertTitle>Blockchain integration pending</AlertTitle>
                      <AlertDescription>
                        {payroll.executionMessage ??
                          'Blockchain integration will be completed using Safe SDK and Nox Protocol.'}
                        {payroll.executionProvider ? (
                          <span className="mt-2 block text-xs">
                            Provider: {payroll.executionProvider}
                            {payroll.network
                              ? ` · Network: ${payroll.network}`
                              : ''}
                            {payroll.transactionHash
                              ? ` · Tx: ${payroll.transactionHash}`
                              : ''}
                          </span>
                        ) : null}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Approval timeline</CardTitle>
                <CardDescription>
                  HR → Finance → CEO sequence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!timelineQuery.data?.steps?.length ? (
                  <p className="text-sm text-muted-foreground">
                    No approval steps yet. Submit the payroll to start the flow.
                  </p>
                ) : (
                  timelineQuery.data.steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 py-2 text-sm last:border-0"
                    >
                      <div>
                        <span className="font-medium">{step.level}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · step {step.sequence}
                        </span>
                        {step.approverName ? (
                          <div className="text-muted-foreground">
                            {step.approverName}
                            {step.comments ? ` - ${step.comments}` : ''}
                          </div>
                        ) : null}
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {String(step.status).toLowerCase()}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Line items</CardTitle>
                <CardDescription>
                  Compensation snapshot at generation time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!payroll.items?.length ? (
                  <p className="text-sm text-muted-foreground">
                    No line items generated.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead className="text-right">Base</TableHead>
                        <TableHead className="text-right">Bonus</TableHead>
                        <TableHead className="text-right">Allowance</TableHead>
                        <TableHead className="text-right">Deductions</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payroll.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>{item.employeeName}</div>
                            {item.walletAddress ? (
                              <div className="font-mono text-[11px] text-muted-foreground">
                                {item.walletAddress}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(
                              item.baseSalaryCents / 100,
                              item.currency
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(
                              item.bonusCents / 100,
                              item.currency
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(
                              item.allowanceCents / 100,
                              item.currency
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(
                              item.deductionsCents / 100,
                              item.currency
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(
                              item.netPayCents / 100,
                              item.currency
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
