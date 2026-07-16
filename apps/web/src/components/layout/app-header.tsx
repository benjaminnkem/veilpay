'use client';

import { BellIcon, LogOutIcon, MenuIcon, UserIcon } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

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
import { ROUTES } from '@/constants/routes';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUiStore } from '@/stores/ui-store';

function getInitials(name?: string | null) {
  if (!name) return 'VP';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function AppHeader() {
  const { user } = useCurrentUser();
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/80 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <MenuIcon />
        </Button>
        <div className="hidden text-sm text-muted-foreground sm:block">
          Enterprise payroll
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Notifications"
          nativeButton={false}
          render={<Link href={ROUTES.notifications} />}
        >
          <BellIcon />
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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {user?.name ?? 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email ?? 'Signed in'}
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                render={<Link href={ROUTES.settings} />}
                nativeButton={false}
              >
                <UserIcon />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: ROUTES.login })}
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
