'use client';

import {
  ClipboardCheckIcon,
  ShieldCheckIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react';

import { LoadingState } from '@/components/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const STATS = [
  {
    label: 'Active employees',
    value: '128',
    description: 'Across all departments',
    icon: UsersIcon,
  },
  {
    label: 'Pending approvals',
    value: '3',
    description: 'Require reviewer action',
    icon: ClipboardCheckIcon,
  },
  {
    label: 'Next payroll',
    value: 'Mar 28',
    description: 'Encrypted batch ready',
    icon: WalletIcon,
  },
  {
    label: 'Confidential mode',
    value: 'On',
    description: 'Nox-backed privacy',
    icon: ShieldCheckIcon,
  },
] as const;

export function DashboardOverview() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <LoadingState variant="cards" rows={4} />;
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </CardTitle>
          <CardDescription>
            Your confidential payroll workspace is ready. Review open approvals
            and the next encrypted run.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-2xl font-semibold tracking-tight">
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
        ))}
      </div>
    </div>
  );
}
