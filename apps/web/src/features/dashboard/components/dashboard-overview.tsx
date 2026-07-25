'use client';

import {
  ArrowRightIcon,
  BlocksIcon,
  ClipboardCheckIcon,
  MailPlusIcon,
  ShieldCheckIcon,
  ShieldIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { ComponentType } from 'react';

import { PageHeader, QueryState, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/constants/routes';
import { DepartmentBreakdownChart } from '@/features/dashboard/components/department-breakdown-chart';
import { PayrollStatusChart } from '@/features/dashboard/components/payroll-status-chart';
import { PayrollTrendChart } from '@/features/dashboard/components/payroll-trend-chart';
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard';
import { TreasuryBalancesPanel } from '@/features/settings/components/treasury-balances-panel';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  canManageInvitations,
  canManageTreasury,
  canViewApprovals,
  canViewAuditLogs,
  canViewDashboardStats,
  canViewEmployees,
  canViewPayroll,
  isEmployeeRole,
} from '@/lib/auth/rbac';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { DashboardStats } from '@repo/types';

export function DashboardOverview() {
  const { user } = useCurrentUser();
  const role = user?.role;
  const showOrgStats = canViewDashboardStats(role);
  const statsQuery = useDashboardStats({ enabled: showOrgStats });

  if (isEmployeeRole(role)) {
    return <EmployeeDashboard name={user?.name} />;
  }

  const stats = statsQuery.data;
  const showEmployees = canViewEmployees(role);
  const showPayroll = canViewPayroll(role);
  const showApprovals = canViewApprovals(role);
  const showAudit = canViewAuditLogs(role);
  const showInvites = canManageInvitations(role);
  const showTreasury = canManageTreasury(role);
  const firstName = user?.name?.split(' ')[0];

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      {showEmployees ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={ROUTES.employees} />}
        >
          <UsersIcon className="size-3.5" />
          Employees
        </Button>
      ) : null}
      {showPayroll ? (
        <Button
          type="button"
          size="sm"
          nativeButton={false}
          render={<Link href={ROUTES.payroll} />}
        >
          <WalletIcon className="size-3.5" />
          Payroll
        </Button>
      ) : null}
      {showApprovals ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={ROUTES.approvals} />}
        >
          <ClipboardCheckIcon className="size-3.5" />
          Approvals
        </Button>
      ) : null}
      {showInvites ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={ROUTES.invitations} />}
        >
          <MailPlusIcon className="size-3.5" />
          Invite
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
        description={
          user?.organizationName
            ? `${user.organizationName} · Payroll analytics & treasury`
            : 'Payroll analytics & treasury'
        }
        actions={headerActions}
      />

      <QueryState
        isLoading={statsQuery.isLoading}
        isError={statsQuery.isError}
        error={statsQuery.error}
        onRetry={() => statsQuery.refetch()}
        isEmpty={!stats}
        emptyTitle="No data yet"
        emptyDescription="Add employees and create a payroll run to unlock analytics."
        loadingVariant="cards"
      >
        {stats ? (
          <div className="space-y-4">
            {showTreasury ? (
              <TreasuryHeroCard treasury={stats.treasury} />
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {showEmployees ? (
                <StatCard
                  label="Employees"
                  value={String(stats.totalEmployees)}
                  hint={`${stats.activeEmployees} active`}
                  icon={UsersIcon}
                  href={ROUTES.employees}
                  accent="primary"
                />
              ) : null}
              {showPayroll ? (
                <StatCard
                  label="Monthly payroll"
                  value={formatCurrency(stats.monthlyPayrollCents / 100)}
                  hint={`${stats.draftPayrolls} draft${stats.draftPayrolls === 1 ? '' : 's'}`}
                  icon={WalletIcon}
                  href={ROUTES.payroll}
                  accent="chart"
                />
              ) : null}
              {showApprovals ? (
                <StatCard
                  label="Pending approvals"
                  value={String(stats.pendingApprovals)}
                  hint={
                    stats.pendingApprovals > 0
                      ? 'Needs your attention'
                      : 'All clear'
                  }
                  icon={ClipboardCheckIcon}
                  href={ROUTES.approvals}
                  accent={stats.pendingApprovals > 0 ? 'warning' : 'muted'}
                />
              ) : null}
              {showPayroll ? (
                <StatCard
                  label="Ready to execute"
                  value={String(stats.approvedPayrolls)}
                  hint={`${stats.blockchainPendingPayrolls} pending on-chain`}
                  icon={BlocksIcon}
                  href={ROUTES.payroll}
                  accent="success"
                />
              ) : null}
            </div>

            {showPayroll ? (
              <div className="grid items-stretch gap-3 lg:grid-cols-5">
                <PayrollTrendChart
                  data={stats.payrollTrend}
                  className="lg:col-span-3"
                />
                <PayrollStatusChart
                  data={stats.payrollByStatus}
                  className="lg:col-span-2"
                />
              </div>
            ) : null}

            <div className="grid items-stretch gap-3 lg:grid-cols-5">
              {showEmployees ? (
                <DepartmentBreakdownChart
                  data={stats.departmentBreakdown}
                  className={showPayroll ? 'lg:col-span-3' : 'lg:col-span-5'}
                />
              ) : null}
              {showPayroll || !showEmployees ? (
                <div
                  className={cn(
                    'grid grid-rows-2 gap-3',
                    showEmployees
                      ? 'lg:col-span-2'
                      : 'lg:col-span-5 lg:grid-cols-2 lg:grid-rows-1',
                  )}
                >
                  {showPayroll ? (
                    <UpcomingPayrollCard payroll={stats.upcomingPayroll} />
                  ) : null}
                  <SnapshotCard stats={stats} />
                </div>
              ) : null}
            </div>

            {showAudit ? (
              <Card className="border-border/60 shadow-none">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">
                      Recent activity
                    </CardTitle>
                    <CardDescription>
                      Latest workspace events and actions
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    nativeButton={false}
                    render={<Link href={ROUTES.auditLogs} />}
                  >
                    View all
                    <ArrowRightIcon className="size-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {stats.recentActivity.length === 0 ? (
                    <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                      No activity yet
                    </p>
                  ) : (
                    <ul className="divide-y divide-border/70">
                      {stats.recentActivity.slice(0, 8).map((item) => (
                        <li
                          key={item.id}
                          className="flex items-start justify-between gap-3 px-6 py-2.5 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium capitalize">
                              {item.action.replaceAll('_', ' ').toLowerCase()}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {item.actorEmail ?? 'System'}
                              {item.entityType
                                ? ` · ${item.entityType.toLowerCase()}`
                                : ''}
                            </p>
                          </div>
                          <time className="shrink-0 text-xs text-muted-foreground tabular-nums">
                            {formatDate(item.createdAt, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </time>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : null}
      </QueryState>
    </div>
  );
}

function EmployeeDashboard({ name }: { name?: string | null }) {
  const firstName = name?.split(' ')[0];

  return (
    <div className="space-y-5">
      <PageHeader
        title={firstName ? `Welcome, ${firstName}` : 'Your workspace'}
        description="Manage payout details, notifications, and your profile."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <LinkCard
          href={ROUTES.settings}
          title="Payout wallet"
          description="Confidential payout destination"
          icon={ShieldIcon}
        />
        <LinkCard
          href={ROUTES.notifications}
          title="Notifications"
          description="Approvals and payroll updates"
          icon={ClipboardCheckIcon}
        />
        <LinkCard
          href={ROUTES.profile}
          title="Profile"
          description="Account and security settings"
          icon={UsersIcon}
        />
      </div>
    </div>
  );
}

function LinkCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full border-border/60 shadow-none transition-colors hover:bg-muted/30">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{title}</span>
              <ArrowRightIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  accent = 'muted',
}: {
  label: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
  accent?: 'primary' | 'chart' | 'warning' | 'success' | 'muted';
}) {
  const iconTone = {
    primary: 'bg-primary/10 text-primary',
    chart: 'bg-chart-2/15 text-chart-2',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    muted: 'bg-muted text-muted-foreground',
  }[accent];

  return (
    <Link href={href} className="block">
      <Card className="h-full border-border/60 shadow-none transition-colors hover:bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <div
              className={cn(
                'flex size-7 items-center justify-center rounded-md',
                iconTone,
              )}
            >
              <Icon className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function TreasuryHeroCard({
  treasury,
}: {
  treasury: DashboardStats['treasury'];
}) {
  const configured = Boolean(treasury.safeAddress && treasury.network);

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-sm font-medium">
              Treasury & on-chain balances
            </CardTitle>
            <StatusBadge status={treasury.status} />
          </div>
          <CardDescription>
            Live Safe balances used for payroll execution
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2 py-1">
            <ShieldCheckIcon className="size-3.5 text-primary" />
            <span className="capitalize">{treasury.executionProvider}</span>
            {treasury.network ? ` · ${treasury.network}` : ''}
          </span>
          {treasury.safeAddress ? (
            <span
              className="max-w-[220px] truncate rounded-md border border-border/60 bg-muted/30 px-2 py-1 font-mono text-[11px]"
              title={treasury.safeAddress}
            >
              {treasury.safeAddress}
            </span>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            nativeButton={false}
            render={<Link href={ROUTES.settings} />}
          >
            Settings
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {configured ? (
          <TreasuryBalancesPanel
            safeAddress={treasury.safeAddress}
            network={treasury.network}
            className="border-0 bg-transparent p-0"
          />
        ) : (
          <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium">No treasury linked</p>
              <p className="max-w-xl text-xs text-muted-foreground">
                {treasury.message ||
                  'Connect a Safe and network to display on-chain ETH and USDC balances here.'}
              </p>
            </div>
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href={ROUTES.settings} />}
            >
              Configure treasury
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingPayrollCard({
  payroll,
}: {
  payroll: DashboardStats['upcomingPayroll'];
}) {
  return (
    <Card className="flex h-full min-h-0 flex-col border-border/60 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Next payroll</CardTitle>
        <CardDescription>Upcoming scheduled run</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center">
        {payroll ? (
          <Link
            href={`${ROUTES.payroll}/${payroll.id}`}
            className="block rounded-lg border border-border/60 px-3 py-3 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium">{payroll.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(payroll.payDate)}
                </p>
              </div>
              <StatusBadge status={payroll.status} />
            </div>
            <p className="mt-3 text-lg font-semibold tabular-nums tracking-tight">
              {formatCurrency(payroll.totalNetPayCents / 100, payroll.currency)}
            </p>
          </Link>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 py-6 text-center">
            <p className="text-sm text-muted-foreground">No upcoming run</p>
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href={ROUTES.payroll} />}
            >
              Create payroll
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SnapshotCard({ stats }: { stats: DashboardStats }) {
  return (
    <Card className="flex h-full min-h-0 flex-col border-border/60 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Analytics snapshot</CardTitle>
        <CardDescription>Quick signals from this workspace</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center space-y-3">
        <SnapshotRow
          label="Active workforce"
          value={`${stats.activeEmployees} / ${stats.totalEmployees}`}
          icon={UsersIcon}
        />
        <Separator />
        <SnapshotRow
          label="Draft payrolls"
          value={String(stats.draftPayrolls)}
          icon={WalletIcon}
        />
        <Separator />
        <SnapshotRow
          label="Pending chain"
          value={String(stats.blockchainPendingPayrolls)}
          icon={BlocksIcon}
        />
        <Separator />
        <SnapshotRow
          label="Monthly volume"
          value={formatCurrency(stats.monthlyPayrollCents / 100)}
          icon={TrendingUpIcon}
        />
      </CardContent>
    </Card>
  );
}

function SnapshotRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
