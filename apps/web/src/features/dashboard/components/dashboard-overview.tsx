'use client';

import {
  ArrowRightIcon,
  BlocksIcon,
  ClipboardCheckIcon,
  MailPlusIcon,
  ShieldCheckIcon,
  ShieldIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react';
import Link from 'next/link';

import { QueryState, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
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

export function DashboardOverview() {
  const { user } = useCurrentUser();
  const role = user?.role;
  const showOrgStats = canViewDashboardStats(role);
  const statsQuery = useDashboardStats({ enabled: showOrgStats });

  if (isEmployeeRole(role)) {
    return <EmployeeDashboard />;
  }

  const stats = statsQuery.data;
  const showEmployees = canViewEmployees(role);
  const showPayroll = canViewPayroll(role);
  const showApprovals = canViewApprovals(role);
  const showAudit = canViewAuditLogs(role);
  const showInvites = canManageInvitations(role);
  const showTreasury = canManageTreasury(role);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            {user?.name ? user.name.split(' ')[0] : 'Overview'}
            {user?.organizationName ? (
              <span className="font-normal text-muted-foreground">
                {' '}
                · {user.organizationName}
              </span>
            ) : null}
          </h2>
        </div>
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
      </div>

      <QueryState
        isLoading={statsQuery.isLoading}
        isError={statsQuery.isError}
        error={statsQuery.error}
        onRetry={() => statsQuery.refetch()}
        isEmpty={!stats}
        emptyTitle="No data yet"
        emptyDescription="Add employees and create a payroll run."
      >
        {stats ? (
          <>
            <div
              className={cn(
                'grid gap-3',
                'sm:grid-cols-2',
                'xl:grid-cols-4',
              )}
            >
              {showEmployees ? (
                <StatCard
                  label="Employees"
                  value={String(stats.totalEmployees)}
                  hint={`${stats.activeEmployees} active`}
                  icon={UsersIcon}
                  href={ROUTES.employees}
                />
              ) : null}
              {showPayroll ? (
                <StatCard
                  label="Monthly payroll"
                  value={formatCurrency(stats.monthlyPayrollCents / 100)}
                  hint={`${stats.draftPayrolls} drafts`}
                  icon={WalletIcon}
                  href={ROUTES.payroll}
                />
              ) : null}
              {showApprovals ? (
                <StatCard
                  label="Pending approvals"
                  value={String(stats.pendingApprovals)}
                  hint="Needs action"
                  icon={ClipboardCheckIcon}
                  href={ROUTES.approvals}
                />
              ) : null}
              {showPayroll ? (
                <StatCard
                  label="Ready to execute"
                  value={String(stats.approvedPayrolls)}
                  hint={`${stats.blockchainPendingPayrolls} pending chain`}
                  icon={BlocksIcon}
                  href={ROUTES.payroll}
                />
              ) : null}
            </div>

            <div className="grid gap-3 lg:grid-cols-5">
              {showPayroll ? (
                <Card className="border-border/60 shadow-none lg:col-span-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Payroll trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {stats.payrollTrend.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No history</p>
                    ) : (
                      stats.payrollTrend.map((row) => {
                        const max = Math.max(
                          ...stats.payrollTrend.map((r) => r.totalNetPayCents),
                          1,
                        );
                        const width = Math.max(
                          6,
                          Math.round((row.totalNetPayCents / max) * 100),
                        );
                        return (
                          <div key={row.month} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium">{row.month}</span>
                              <span className="text-muted-foreground">
                                {formatCurrency(row.totalNetPayCents / 100)}
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {showTreasury ? (
                <Card className="border-border/60 shadow-none lg:col-span-2">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Treasury
                    </CardTitle>
                    <StatusBadge status={stats.treasury.status} />
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ShieldCheckIcon className="size-3.5 text-primary" />
                      <span className="capitalize">
                        {stats.treasury.executionProvider}
                      </span>
                      {stats.treasury.network
                        ? ` · ${stats.treasury.network}`
                        : ''}
                    </div>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {stats.treasury.safeAddress || 'No Safe linked'}
                    </p>
                    {stats.treasury.safeAddress && stats.treasury.network ? (
                      <TreasuryBalancesPanel
                        safeAddress={stats.treasury.safeAddress}
                        network={stats.treasury.network}
                        compact
                      />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={<Link href={ROUTES.settings} />}
                      >
                        Link Safe
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <div className="grid gap-3 lg:grid-cols-5">
              {showAudit ? (
                <Card className="border-border/60 shadow-none lg:col-span-3">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Recent activity
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      nativeButton={false}
                      render={<Link href={ROUTES.auditLogs} />}
                    >
                      All
                      <ArrowRightIcon className="size-3.5" />
                    </Button>
                  </CardHeader>
                  <CardContent className="divide-y divide-border/80 p-0">
                    {stats.recentActivity.length === 0 ? (
                      <p className="px-6 py-4 text-sm text-muted-foreground">
                        No activity
                      </p>
                    ) : (
                      stats.recentActivity.slice(0, 8).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 px-6 py-2 text-sm"
                        >
                          <div className="min-w-0 truncate">
                            <span className="font-medium">
                              {item.action.replaceAll('_', ' ')}
                            </span>
                            {item.actorEmail ? (
                              <span className="text-muted-foreground">
                                {' '}
                                · {item.actorEmail}
                              </span>
                            ) : null}
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ) : null}

              <Card className="border-border/60 shadow-none lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {showEmployees ? 'Departments' : 'Next up'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {showEmployees
                    ? stats.departmentBreakdown.length === 0
                      ? (
                          <p className="text-sm text-muted-foreground">None</p>
                        )
                      : (
                          stats.departmentBreakdown.slice(0, 6).map((row) => (
                            <div
                              key={row.department}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="truncate">{row.department}</span>
                              <span className="tabular-nums text-muted-foreground">
                                {row.employeeCount}
                              </span>
                            </div>
                          ))
                        )
                    : null}

                  {showPayroll && stats.upcomingPayroll ? (
                    <Link
                      href={`${ROUTES.payroll}/${stats.upcomingPayroll.id}`}
                      className="mt-1 block rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors hover:bg-muted/40"
                    >
                      <div className="font-medium">
                        {stats.upcomingPayroll.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(stats.upcomingPayroll.payDate)} ·{' '}
                        {formatCurrency(
                          stats.upcomingPayroll.totalNetPayCents / 100,
                          stats.upcomingPayroll.currency,
                        )}
                      </div>
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}

function EmployeeDashboard() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <LinkCard
        href={ROUTES.settings}
        title="Payout"
        icon={ShieldIcon}
      />
      <LinkCard
        href={ROUTES.notifications}
        title="Notifications"
        icon={ClipboardCheckIcon}
      />
      <LinkCard href={ROUTES.profile} title="Profile" icon={UsersIcon} />
    </div>
  );
}

function LinkCard({
  href,
  title,
  icon: Icon,
}: {
  href: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link href={href} className="block">
      <Card className="border-border/60 shadow-none transition-colors hover:bg-muted/30">
        <CardContent className="flex items-center gap-3 p-4">
          <Icon className="size-4 text-primary" />
          <span className="text-sm font-medium">{title}</span>
          <ArrowRightIcon className="ml-auto size-3.5 text-muted-foreground" />
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
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full border-border/60 shadow-none transition-colors hover:bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <Icon className="size-3.5 text-muted-foreground" />
          </div>
          <p className="mt-1.5 text-xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
