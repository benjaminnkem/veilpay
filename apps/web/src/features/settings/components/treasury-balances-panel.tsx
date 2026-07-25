'use client';

import {
  AlertTriangleIcon,
  CoinsIcon,
  FuelIcon,
  RefreshCwIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTreasuryBalances } from '@/features/settings/hooks/use-treasury-balances';
import { hasGasForExecution, hasUsdcCoverage } from '@/lib/web3/balances';
import { cn } from '@/lib/utils';

interface TreasuryBalancesPanelProps {
  safeAddress?: string | null;
  network?: string | null;
  requiredUsdc?: number;
  compact?: boolean;
  className?: string;
}

export function TreasuryBalancesPanel({
  safeAddress,
  network,
  requiredUsdc,
  compact = false,
  className,
}: TreasuryBalancesPanelProps) {
  const balancesQuery = useTreasuryBalances(safeAddress, network);

  if (!safeAddress || !network) {
    return null;
  }

  const balances = balancesQuery.data;
  const ethOk = hasGasForExecution(balances);
  const usdcOk =
    requiredUsdc == null
      ? Boolean(
          balances?.usdc &&
          Number(balances.usdc.formatted.replace(/,/g, '')) > 0,
        )
      : hasUsdcCoverage(balances, requiredUsdc);

  return (
    <div
      className={cn(
        'rounded-xl border border-border/70 bg-muted/20 p-4',
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CoinsIcon className="size-4 text-primary" />
          On-chain balances
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={balancesQuery.isFetching}
          onClick={() => void balancesQuery.refetch()}
        >
          <RefreshCwIcon
            className={cn(
              'size-3.5',
              balancesQuery.isFetching && 'animate-spin',
            )}
          />
          Refresh
        </Button>
      </div>

      {balancesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Reading balances…</p>
      ) : balancesQuery.isError ? (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            {(balancesQuery.error as Error)?.message ||
              'Could not read Safe balances. Check the network and try again.'}
          </span>
        </div>
      ) : balances ? (
        <div className="space-y-3">
          <div
            className={cn(
              'grid gap-3',
              compact ? 'grid-cols-1' : 'sm:grid-cols-2',
            )}
          >
            <BalanceTile
              icon={<FuelIcon className="size-3.5" />}
              label={balances.eth.symbol}
              value={balances.eth.formatted}
              hint="Gas for Safe execution"
              ok={ethOk}
            />
            <BalanceTile
              icon={<CoinsIcon className="size-3.5" />}
              label={balances.usdc?.symbol ?? 'USDC'}
              value={balances.usdc?.formatted ?? '—'}
              hint={
                balances.usdc?.address
                  ? `Token ${balances.usdc.address.slice(0, 10)}…`
                  : 'No USDC configured for this network'
              }
              ok={usdcOk}
              missing={!balances.usdc}
            />
          </div>

          {!ethOk ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Low native gas. Fund the Safe with a little test ETH so execution
              transactions can pay fees.
            </p>
          ) : null}

          {balances.usdc &&
          requiredUsdc != null &&
          !hasUsdcCoverage(balances, requiredUsdc) ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              USDC balance may be below the required payroll total (
              {requiredUsdc.toLocaleString()} USDC).
            </p>
          ) : null}

          {!balances.usdc ? (
            <p className="text-xs text-muted-foreground">
              USDC is not available for this network yet.
            </p>
          ) : null}

          <p className="text-[11px] text-muted-foreground">
            Live balances · {balances.network.name}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function BalanceTile({
  icon,
  label,
  value,
  hint,
  ok,
  missing,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  ok: boolean;
  missing?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {icon}
          {label}
        </span>
        {missing ? (
          <Badge variant="outline">N/A</Badge>
        ) : ok ? (
          <Badge variant="secondary">OK</Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-700 dark:text-amber-300"
          >
            Low
          </Badge>
        )}
      </div>
      <div className="text-lg font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
