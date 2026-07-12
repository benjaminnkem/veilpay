'use client';

import {
  ClipboardCheckIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  ScrollTextIcon,
  SettingsIcon,
  UsersIcon,
  WalletIcon,
  XIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/constants/routes';
import { useUiStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: ROUTES.dashboard,
    icon: LayoutDashboardIcon,
  },
  {
    label: 'Employees',
    href: ROUTES.employees,
    icon: UsersIcon,
  },
  {
    label: 'Payroll',
    href: ROUTES.payroll,
    icon: WalletIcon,
  },
  {
    label: 'Approvals',
    href: ROUTES.approvals,
    icon: ClipboardCheckIcon,
  },
  {
    label: 'Audit Logs',
    href: ROUTES.auditLogs,
    icon: ScrollTextIcon,
  },
  {
    label: 'Settings',
    href: ROUTES.settings,
    icon: SettingsIcon,
  },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-2 text-sm transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useUiStore();

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarCollapsed && 'lg:w-16'
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Link
            href={ROUTES.dashboard}
            className="flex items-center gap-2 font-semibold tracking-tight text-sidebar-foreground"
          >
            <span className="flex size-7 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
              V
            </span>
            {!sidebarCollapsed ? <span>VeilPay</span> : null}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <XIcon />
          </Button>
        </div>

        <Separator />

        <nav className="flex-1 space-y-1 p-2" aria-label="Dashboard">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={sidebarCollapsed ? '' : item.label}
              icon={item.icon}
              onNavigate={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3 text-xs text-muted-foreground">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <FileTextIcon className="size-3.5" aria-hidden />
              <span>Confidential payroll</span>
            </div>
          ) : null}
          <span className="sr-only">Current path: {pathname}</span>
        </div>
      </aside>
    </>
  );
}
