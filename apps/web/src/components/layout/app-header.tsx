'use client';

import {
  BellIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ROUTES } from '@/constants/routes';
import { logout } from '@/features/auth/services/logout';
import { useUnreadCount } from '@/features/notifications/hooks/use-notifications';
import { useCurrentUser } from '@/hooks/useCurrentUser';

function getInitials(name?: string | null) {
  if (!name) return 'VP';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const TITLE_MAP: Record<string, string> = {
  [ROUTES.dashboard]: 'Dashboard',
  [ROUTES.employees]: 'Employees',
  [ROUTES.payroll]: 'Payroll',
  [ROUTES.approvals]: 'Approvals',
  [ROUTES.auditLogs]: 'Audit logs',
  [ROUTES.notifications]: 'Notifications',
  [ROUTES.invitations]: 'Invitations',
  [ROUTES.settings]: 'Settings',
};

function resolveTitle(pathname: string): string {
  const match = Object.entries(TITLE_MAP).find(
    ([href]) => pathname === href || pathname.startsWith(`${href}/`)
  );
  return match?.[1] ?? 'Workspace';
}

export function AppHeader() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const unread = useUnreadCount();
  const unreadCount = unread.data?.count ?? 0;
  const title = resolveTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-background/85 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="hidden h-5 sm:block" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium tracking-tight">{title}</p>
          {user?.organizationName ? (
            <p className="truncate text-[11px] text-muted-foreground">
              {user.organizationName}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label="Notifications"
          nativeButton={false}
          render={<Link href={ROUTES.notifications} />}
        >
          <BellIcon />
          {unreadCount > 0 ? (
            <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />
          ) : null}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 px-1.5"
                aria-label="Open account menu"
              />
            }
          >
            <Avatar className="size-7">
              <AvatarFallback className="text-[10px]">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[140px] truncate text-left text-xs sm:block">
              {user?.name ?? 'Account'}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {user?.name ?? 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email ?? 'Signed in'}
                  </span>
                  {user?.role ? (
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {String(user.role).replaceAll('_', ' ').toLowerCase()}
                    </span>
                  ) : null}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                render={<Link href={ROUTES.profile} />}
                nativeButton={false}
              >
                <UserIcon />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                render={<Link href={ROUTES.settings} />}
                nativeButton={false}
              >
                <SettingsIcon />
                Workspace settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  void logout();
                }}
              >
                <LogOutIcon />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
