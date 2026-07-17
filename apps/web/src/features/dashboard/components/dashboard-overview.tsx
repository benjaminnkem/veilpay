'use client';

import {
  ArrowRightIcon,
  BlocksIcon,
  ClipboardCheckIcon,
  MailPlusIcon,
  ShieldCheckIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react';
import Link from 'next/link';

import { QueryState, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard';
import { TreasuryBalancesPanel } from '@/features/settings/components/treasury-balances-panel';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatCurrency, formatDate } from '@/lib/utils';

export function DashboardOverview() {
  const { user } = useCurrentUser();
  const statsQuery = useDashboardStats();
  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h2>
          <p className="text-sm text-muted-foreground">
            {user?.organizationName ? `${user.organizationName} · ` : ''}
            Payroll ops through approval - blockchain execution pending.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.employees} />}
          >
            <UsersIcon className="size-4" />
            Employees
          </Button>
          <Button
            type="button"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.payroll} />}
          >
            <WalletIcon className="size-4" />
            Payroll
          </Button>
        </div>
      </div>

      <QueryState
        isLoading={statsQuery.isLoading}
        isError={statsQuery.isError}
        error={statsQuery.error}
        onRetry={() => statsQuery.refetch()}
        isEmpty={!stats}
        emptyTitle="No dashboard data"
        emptyDescription="Create employees and a payroll run to populate metrics."
      >
        {stats ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total employees"
                value={String(stats.totalEmployees)}
                description={`${stats.activeEmployees} active`}
                icon={UsersIcon}
                href={ROUTES.employees}
              />
              <StatCard
                label="Monthly payroll"
                value={formatCurrency(stats.monthlyPayrollCents / 100)}
                description="Approved / pending / completed this month"
                icon={WalletIcon}
                href={ROUTES.payroll}
              />
              <StatCard
                label="Pending approvals"
                value={String(stats.pendingApprovals)}
                description={`${stats.draftPayrolls} draft runs`}
                icon={ClipboardCheckIcon}
                href={ROUTES.approvals}
              />
              <StatCard
                label="Ready for execution"
                value={String(stats.approvedPayrolls)}
                description={`${stats.blockchainPendingPayrolls} blockchain pending`}
                icon={BlocksIcon}
                href={ROUTES.payroll}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              <Card className="border-border/70 shadow-sm lg:col-span-3">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">Payroll trend</CardTitle>
                    <CardDescription>Net pay by month</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.payrollTrend.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No payroll history yet.
                    </p>
                  ) : (
                    stats.payrollTrend.map((row) => {
                      const max = Math.max(
                        ...stats.payrollTrend.map((r) => r.totalNetPayCents),
                        1
                      );
                      const width = Math.max(
                        8,
                        Math.round((row.totalNetPayCents / max) * 100)
                      );
                      return (
                        <div key={row.month} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{row.month}</span>
                            <span className="text-muted-foreground">
                              {formatCurrency(row.totalNetPayCents / 100)} ·{' '}
                              {row.runCount} run{row.runCount === 1 ? '' : 's'}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
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

              <Card className="border-border/70 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Treasury</CardTitle>
                  <CardDescription>
                    Linked Safe and live on-chain balances
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="size-4 text-primary" />
                    <StatusBadge status={stats.treasury.status} />
                  </div>
                  <p className="text-muted-foreground">{stats.treasury.message}</p>
                  <div className="space-y-1 text-xs">
                    <div>
                      Provider:{' '}
                      <span className="font-medium">
                        {stats.treasury.executionProvider}
                      </span>
                    </div>
                    <div className="truncate font-mono">
                      Safe: {stats.treasury.safeAddress || 'Not set'}
                    </div>
                    <div>Network: {stats.treasury.network || 'Not set'}</div>
                  </div>
                  {stats.treasury.safeAddress && stats.treasury.network ? (
                    <TreasuryBalancesPanel
                      safeAddress={stats.treasury.safeAddress}
                      network={stats.treasury.network}
                      compact
                    />
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href={ROUTES.settings} />}
                  >
                    Configure treasury
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              <Card className="border-border/70 shadow-sm lg:col-span-3">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">Recent activity</CardTitle>
                    <CardDescription>Audit feed</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    nativeButton={false}
                    render={<Link href={ROUTES.auditLogs} />}
                  >
                    View all
                    <ArrowRightIcon className="size-4" />
                  </Button>
                </CardHeader>
                <CardContent className="divide-y divide-border">
                  {stats.recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No activity yet.
                    </p>
                  ) : (
                    stats.recentActivity.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                      >
                        <div className="min-w-0">
                          <div className="font-medium">
                            {item.action.replaceAll('_', ' ')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.entityType}
                            {item.actorEmail ? ` · ${item.actorEmail}` : ''}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Departments</CardTitle>
                  <CardDescription>Headcount breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.departmentBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No departments yet.
                    </p>
                  ) : (
                    stats.departmentBreakdown.map((row) => (
                      <div
                        key={row.department}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{row.department}</span>
                        <BadgeCount value={row.employeeCount} />
                      </div>
                    ))
                  )}
                  {stats.upcomingPayroll ? (
                    <div className="mt-4 rounded-lg border border-border/70 bg-muted/30 p-3 text-sm">
                      <div className="text-xs text-muted-foreground">
                        Upcoming payroll
                      </div>
                      <div className="font-medium">
                        {stats.upcomingPayroll.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(stats.upcomingPayroll.payDate)} ·{' '}
                        {formatCurrency(
                          stats.upcomingPayroll.totalNetPayCents / 100,
                          stats.upcomingPayroll.currency
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="link"
                        className="h-auto px-0"
                        nativeButton={false}
                        render={
                          <Link
                            href={`${ROUTES.payroll}/${stats.upcomingPayroll.id}`}
                          />
                        }
                      >
                        Open run
                      </Button>
                    </div>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    nativeButton={false}
                    render={<Link href={ROUTES.invitations} />}
                  >
                    <MailPlusIcon className="size-4" />
                    Invite teammate
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full border-border/70 shadow-sm transition-colors hover:bg-muted/20">
        <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
          <Icon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function BadgeCount({ value }: { value: number }) {
  return (
    <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
      {value}
    </span>
  );
}
