'use client';

import {
  ClipboardCheckIcon,
  ShieldCheckIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react';
import Link from 'next/link';

import { LoadingState } from '@/components/shared';
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

export function DashboardOverview() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const employees = useEmployees();
  const payroll = usePayrollRuns();
  const approvals = useApprovals();

  const isLoading =
    userLoading || employees.isLoading || payroll.isLoading || approvals.isLoading;

  if (isLoading) {
    return <LoadingState variant="cards" rows={4} />;
  }

  const employeeCount = employees.data?.meta.total ?? employees.data?.data.length ?? 0;
  const pendingApprovals = approvals.data?.length ?? 0;
  const nextPayroll = payroll.data?.[0];

  const stats = [
    {
      label: 'Active employees',
      value: String(employeeCount),
      description: 'In your organization',
      icon: UsersIcon,
      href: ROUTES.employees,
    },
    {
      label: 'Pending approvals',
      value: String(pendingApprovals),
      description: 'Require reviewer action',
      icon: ClipboardCheckIcon,
      href: ROUTES.approvals,
    },
    {
      label: 'Latest payroll',
      value: nextPayroll
        ? String(nextPayroll.status).replaceAll('_', ' ')
        : '—',
      description: nextPayroll?.periodLabel ?? 'No runs yet',
      icon: WalletIcon,
      href: ROUTES.payroll,
    },
    {
      label: 'Payment rail',
      value: 'Mock',
      description: 'Blockchain provider ready to plug in',
      icon: ShieldCheckIcon,
      href: ROUTES.payroll,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </CardTitle>
          <CardDescription>
            {user?.organizationName
              ? `${user.organizationName} · `
              : ''}
            Your confidential payroll workspace is ready. Review open approvals
            and draft payroll runs.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="border-border/60 transition-colors hover:bg-muted/30">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="text-2xl font-semibold tracking-tight capitalize">
                    {stat.value}
                  </CardTitle>
                </div>
                <stat.icon
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {stat.description}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
