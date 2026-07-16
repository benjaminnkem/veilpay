'use client';

import {
  ArrowRightIcon,
  ClipboardCheckIcon,
  MailPlusIcon,
  ShieldCheckIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react';
import Link from 'next/link';

import { LoadingState, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { useApprovals } from '@/features/approvals/hooks/use-approvals';
import { useEmployees } from '@/features/employees/hooks/use-employees';
import { usePayrollRuns } from '@/features/payroll/hooks/use-payroll-runs';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatCurrency, formatDate } from '@/lib/utils';

export function DashboardOverview() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const employees = useEmployees({ pageSize: 5 });
  const payroll = usePayrollRuns();
  const approvals = useApprovals();

  const isLoading =
    userLoading ||
    employees.isLoading ||
    payroll.isLoading ||
    approvals.isLoading;

  if (isLoading) {
    return <LoadingState variant="cards" rows={4} />;
  }

  const employeeCount =
    employees.data?.meta.total ?? employees.data?.data.length ?? 0;
  const pendingApprovals = approvals.data?.length ?? 0;
  const runs = payroll.data ?? [];
  const latestRuns = runs.slice(0, 5);
  const draftCount = runs.filter(
    (r) => String(r.status).toUpperCase() === 'DRAFT'
  ).length;
  const totalNet = runs
    .filter((r) =>
      ['APPROVED', 'COMPLETED', 'PROCESSING'].includes(
        String(r.status).toUpperCase()
      )
    )
    .reduce((sum, r) => sum + (r.totalAmount ?? 0), 0);

  const stats = [
    {
      label: 'Employees',
      value: String(employeeCount),
      description: 'Directory headcount',
      icon: UsersIcon,
      href: ROUTES.employees,
    },
    {
      label: 'Pending approvals',
      value: String(pendingApprovals),
      description: 'Awaiting your action',
      icon: ClipboardCheckIcon,
      href: ROUTES.approvals,
    },
    {
      label: 'Draft payrolls',
      value: String(draftCount),
      description: 'Ready to submit',
      icon: WalletIcon,
      href: ROUTES.payroll,
    },
    {
      label: 'Payment rail',
      value: 'Mock',
      description: 'Blockchain provider ready',
      icon: ShieldCheckIcon,
      href: ROUTES.payroll,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h2>
          <p className="text-sm text-muted-foreground">
            {user?.organizationName ? `${user.organizationName} · ` : ''}
            Manage employees, payroll cycles, approvals, and audit activity.
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
            Employees
          </Button>
          <Button
            type="button"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.payroll} />}
          >
            New payroll
            <ArrowRightIcon />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="block">
            <Card className="h-full border-border/70 shadow-sm transition-colors hover:bg-muted/20">
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <stat.icon
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-2xl font-semibold tracking-tight capitalize">
                  {stat.value}
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="border-border/70 shadow-sm lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent payroll runs</CardTitle>
              <CardDescription>
                {totalNet > 0
                  ? `${formatCurrency(totalNet)} in approved/processing volume`
                  : 'Latest cycles in your organization'}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={ROUTES.payroll} />}
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-0 divide-y divide-border/70">
            {latestRuns.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">
                No payroll runs yet.
              </p>
            ) : (
              latestRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`${ROUTES.payroll}/${run.id}`}
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/20"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {run.name ?? run.periodLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {run.employeeCount} employees ·{' '}
                      {formatDate(run.scheduledAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-medium">
                      {formatCurrency(run.totalAmount, run.currency)}
                    </span>
                    <StatusBadge status={String(run.status)} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Needs attention</CardTitle>
            <CardDescription>Approvals and next steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals === 0 ? (
              <p className="text-sm text-muted-foreground">
                You&apos;re caught up on approvals.
              </p>
            ) : (
              (approvals.data ?? []).slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/70 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <StatusBadge status={String(item.status)} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.summary}
                  </p>
                  {item.payrollId ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="mt-1 h-auto px-0"
                      nativeButton={false}
                      render={
                        <Link href={`${ROUTES.payroll}/${item.payrollId}`} />
                      }
                    >
                      Open payroll
                    </Button>
                  ) : null}
                </div>
              ))
            )}

            <div className="grid gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                nativeButton={false}
                render={<Link href={ROUTES.approvals} />}
              >
                <ClipboardCheckIcon />
                Review approvals
              </Button>
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                nativeButton={false}
                render={<Link href={ROUTES.invitations} />}
              >
                <MailPlusIcon />
                Invite teammates
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
