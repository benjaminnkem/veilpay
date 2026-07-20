'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  BlocksIcon,
  ExternalLinkIcon,
  ShieldAlertIcon,
  WalletIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

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
import { TreasuryBalancesPanel } from '@/features/settings/components/treasury-balances-panel';
import { getOrganization } from '@/features/settings/services/updateProfile';
import {
  cancelPayroll,
  executePayroll,
  getPayroll,
  regeneratePayroll,
  submitPayroll,
} from '@/features/payroll/services/getPayrollRuns';
import { payrollRunsQueryKey } from '@/features/payroll/hooks/use-payroll-runs';
import {
  computePayoutReadiness,
  shortWallet,
} from '@/features/payroll/utils/payout-readiness';
import { getNetworkByKey } from '@/lib/web3/config';
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

  const orgQuery = useQuery({
    queryKey: ['organization', 'me'],
    queryFn: getOrganization,
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
      if (status === 'COMPLETED') {
        notify.success(
          'Payroll executed',
          run.transactionHash
            ? `Transaction ${run.transactionHash.slice(0, 12)}…`
            : (run.executionMessage ?? 'USDC transfers submitted from Safe.'),
        );
      } else if (status === 'BLOCKCHAIN_PENDING') {
        notify.info(
          'Awaiting Safe signatures or confirmation',
          run.executionMessage ??
            'Transaction proposed. Collect remaining Safe owner signatures if needed.',
        );
      } else {
        notify.success('Executed', 'Payroll processed via payment provider.');
      }
      await qc.invalidateQueries({ queryKey: ['treasury-balances'] });
      await invalidate();
    },
    onError: (e) => notify.error(e),
  });

  const regenerate = useMutation({
    mutationFn: () => regeneratePayroll(payrollId),
    onSuccess: async () => {
      notify.success(
        'Regenerated',
        'Payroll items refreshed from compensation.',
      );
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
    status,
  );

  const readiness = useMemo(() => {
    if (payroll?.payoutReadiness) return payroll.payoutReadiness;
    return computePayoutReadiness(payroll?.items);
  }, [payroll]);

  const network = getNetworkByKey(payroll?.network ?? orgQuery.data?.network);
  const explorerTxUrl =
    payroll?.transactionHash && network
      ? `${network.explorer}/tx/${payroll.transactionHash}`
      : null;
  const executionProvider = orgQuery.data?.executionProvider ?? 'mock';
  const isBlockchain = executionProvider === 'blockchain';
  const isNox = executionProvider === 'nox';
  const canExecute =
    status === 'APPROVED' &&
    readiness.payableCount > 0 &&
    readiness.missingWalletCount === 0 &&
    (isNox
      ? Boolean(orgQuery.data?.confidentialTokenAddress) &&
        Boolean(orgQuery.data?.network) &&
        Boolean(orgQuery.data?.safeAddress)
      : !isBlockchain ||
        (Boolean(orgQuery.data?.safeAddress) &&
          Boolean(orgQuery.data?.network)));
  const requiredUsdc = readiness.payableNetPayCents / 100;

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
                        disabled={
                          submit.isPending || readiness.payableCount === 0
                        }
                      >
                        Submit for approval
                      </Button>
                    </>
                  ) : null}
                  {status === 'APPROVED' ? (
                    <Button
                      size="sm"
                      onClick={() => execute.mutate()}
                      disabled={execute.isPending || !canExecute}
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
                <Stat label="Employees" value={String(payroll.employeeCount)} />
                <Stat
                  label="Net total"
                  value={formatCurrency(
                    payroll.totalAmount ??
                      (payroll.totalNetPayCents ?? 0) / 100,
                    payroll.currency,
                  )}
                />
                <Stat
                  label="Ready to pay"
                  value={`${readiness.readyCount} / ${readiness.payableCount || payroll.employeeCount}`}
                />
                <Stat
                  label="Missing wallets"
                  value={String(readiness.missingWalletCount)}
                />
              </CardContent>
            </Card>

            {readiness.missingWalletCount > 0 || readiness.zeroPayCount > 0 ? (
              <Alert>
                <WalletIcon />
                <AlertTitle>Payout readiness</AlertTitle>
                <AlertDescription>
                  <span className="block">
                    {readiness.readyCount} ready ·{' '}
                    {readiness.missingWalletCount} missing wallet ·{' '}
                    {readiness.zeroPayCount} zero-pay (skipped on execute)
                  </span>
                  {readiness.missingWalletCount > 0 ? (
                    <span className="mt-2 block text-amber-700 dark:text-amber-300">
                      Missing wallets:{' '}
                      {readiness.missingWalletNames.slice(0, 8).join(', ')}
                      {readiness.missingWalletCount > 8
                        ? ` (+${readiness.missingWalletCount - 8} more)`
                        : ''}
                      . Employees link wallets under Settings → Payout wallet.
                      Wallets re-sync automatically at submit and execute.
                    </span>
                  ) : null}
                </AlertDescription>
              </Alert>
            ) : null}

            {status === 'APPROVED' ||
            status === 'BLOCKCHAIN_PENDING' ||
            status === 'COMPLETED' ? (
              <Card className="border-primary/25 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BlocksIcon className="size-4 text-primary" />
                    Execution
                  </CardTitle>
                  <CardDescription>
                    {isNox
                      ? 'Nox path: Safe wraps treasury USDC into confidential cToken credited to the owner wallet, then the owner sends encrypted confidentialTransfers. Amounts stay hidden on-chain.'
                      : 'Safe multi-send path: one public USDC transfer per ready employee wallet. Zero-pay lines are skipped.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3 text-sm">
                    <Stat
                      label="Transfers"
                      value={String(readiness.readyCount)}
                    />
                    <Stat
                      label="Payable total"
                      value={formatCurrency(
                        requiredUsdc,
                        payroll.currency,
                      )}
                    />
                    <Stat
                      label="Rail"
                      value={
                        isNox
                          ? 'Nox ERC-7984'
                          : isBlockchain
                            ? 'Safe USDC'
                            : String(executionProvider)
                      }
                    />
                  </div>

                  {isNox ? (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                      <p className="font-medium">Confidential settlement (Safe)</p>
                      <p className="mt-1 text-muted-foreground">
                        Network: {orgQuery.data?.network ?? '—'} · Safe:{' '}
                        <span className="font-mono text-xs">
                          {orgQuery.data?.safeAddress
                            ? shortWallet(orgQuery.data.safeAddress)
                            : 'not set'}
                        </span>{' '}
                        · cToken:{' '}
                        <span className="font-mono text-xs">
                          {orgQuery.data?.confidentialTokenAddress
                            ? shortWallet(
                                orgQuery.data.confidentialTokenAddress,
                              )
                            : 'not set'}
                        </span>
                      </p>
                      <p className="mt-2 text-muted-foreground">
                        USDC is taken from the Safe. MetaMask owner needs a
                        little Sepolia ETH for the confidential pay txs. Fund
                        the Safe with payroll USDC + ETH for the wrap step.
                      </p>
                      {!orgQuery.data?.confidentialTokenAddress ||
                      !orgQuery.data?.safeAddress ? (
                        <p className="mt-2 text-amber-700 dark:text-amber-300">
                          Link Safe treasury and set the ERC-7984 cToken in
                          Organization settings before executing.
                        </p>
                      ) : null}
                    </div>
                  ) : orgQuery.data?.safeAddress && orgQuery.data?.network ? (
                    <TreasuryBalancesPanel
                      safeAddress={orgQuery.data.safeAddress}
                      network={orgQuery.data.network}
                      requiredUsdc={requiredUsdc || undefined}
                    />
                  ) : (
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      No Safe treasury linked yet. Connect one in Organization
                      settings, or switch execution mode to Nox.
                    </p>
                  )}

                  {status === 'APPROVED' ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Fully approved.{' '}
                        {isNox
                          ? `Execute will encrypt and confidentially transfer ${readiness.readyCount} payroll amount${readiness.readyCount === 1 ? '' : 's'} totaling ${formatCurrency(requiredUsdc, payroll.currency)}.`
                          : `Execute builds a Safe batch of ${readiness.readyCount} USDC transfer${readiness.readyCount === 1 ? '' : 's'} totaling ${formatCurrency(requiredUsdc, payroll.currency)}.`}
                      </p>
                      {readiness.missingWalletCount > 0 ? (
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Execution is blocked until every payable employee has
                          a payout wallet ({readiness.missingWalletCount}{' '}
                          remaining).
                        </p>
                      ) : null}
                      <Button
                        onClick={() => execute.mutate()}
                        disabled={execute.isPending || !canExecute}
                      >
                        {execute.isPending
                          ? isNox
                            ? 'Nox execute can take 1–2 min…'
                            : 'Executing batch…'
                          : isNox
                            ? `Execute ${readiness.readyCount} confidential pay${readiness.readyCount === 1 ? '' : 's'}`
                            : `Execute ${readiness.readyCount} transfer${readiness.readyCount === 1 ? '' : 's'}`}
                      </Button>
                    </>
                  ) : null}

                  {status === 'BLOCKCHAIN_PENDING' || status === 'COMPLETED' ? (
                    <Alert>
                      <ShieldAlertIcon />
                      <AlertTitle>
                        {status === 'COMPLETED'
                          ? isNox ||
                            payroll.executionProvider === 'nox'
                            ? 'Confidential Nox payroll completed'
                            : 'Payroll batch executed on-chain'
                          : isNox || payroll.executionProvider === 'nox'
                            ? 'Confidential Nox settlement pending'
                            : 'Safe multi-recipient batch pending'}
                      </AlertTitle>
                      <AlertDescription>
                        {payroll.executionMessage ??
                          (status === 'COMPLETED'
                            ? 'USDC transfers were submitted from the organization Safe.'
                            : 'Awaiting additional Safe signatures or chain confirmation.')}
                        {(isNox || payroll.executionProvider === 'nox') &&
                        status === 'COMPLETED' ? (
                          <span className="mt-2 block text-xs text-muted-foreground">
                            Recipients receive encrypted cToken balances, not
                            plain USDC in MetaMask. Open the pay tx on Sepolia
                            explorer and look for ConfidentialTransfer. Safe
                            USDC only drops on the wrap step (locked in the
                            cToken contract).
                          </span>
                        ) : null}
                        <span className="mt-2 block space-y-1 text-xs">
                          {payroll.executionProvider ? (
                            <span className="block">
                              Provider: {payroll.executionProvider}
                              {payroll.network
                                ? ` · Network: ${payroll.network}`
                                : ''}
                            </span>
                          ) : null}
                          {payroll.transactionHash ? (
                            <span className="block font-mono break-all">
                              Tx: {payroll.transactionHash}
                            </span>
                          ) : null}
                          {explorerTxUrl ? (
                            <a
                              href={explorerTxUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              View on explorer
                              <ExternalLinkIcon className="size-3" />
                            </a>
                          ) : null}
                        </span>
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Approval timeline</CardTitle>
                <CardDescription>HR → Finance → CEO sequence</CardDescription>
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
                  Compensation snapshot at generation time · payout wallets
                  re-sync at submit/execute
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
                        <TableHead>Payout</TableHead>
                        <TableHead className="text-right">Base</TableHead>
                        <TableHead className="text-right">Bonus</TableHead>
                        <TableHead className="text-right">Allowance</TableHead>
                        <TableHead className="text-right">Deductions</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payroll.items.map((item) => {
                        const payoutStatus =
                          item.netPayCents <= 0
                            ? 'zero'
                            : item.walletAddress
                              ? 'ready'
                              : 'missing';
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>{item.employeeName}</div>
                              {item.walletAddress ? (
                                <div className="font-mono text-[11px] text-muted-foreground">
                                  {shortWallet(item.walletAddress)}
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  payoutStatus === 'ready'
                                    ? 'secondary'
                                    : 'outline'
                                }
                                className="text-[10px] capitalize"
                              >
                                {payoutStatus === 'ready'
                                  ? 'Ready'
                                  : payoutStatus === 'zero'
                                    ? 'Zero pay'
                                    : 'No wallet'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                item.baseSalaryCents / 100,
                                item.currency,
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                item.bonusCents / 100,
                                item.currency,
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                item.allowanceCents / 100,
                                item.currency,
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                item.deductionsCents / 100,
                                item.currency,
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(
                                item.netPayCents / 100,
                                item.currency,
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
