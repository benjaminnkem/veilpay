'use client';

import {
  BellIcon,
  Building2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardCheckIcon,
  LayoutDashboardIcon,
  MailPlusIcon,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { useApprovals } from '@/features/approvals/hooks/use-approvals';
import { useUnreadCount } from '@/features/notifications/hooks/use-notifications';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: 'approvals' | 'notifications';
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: ROUTES.dashboard,
        icon: LayoutDashboardIcon,
      },
    ],
  },
  {
    label: 'Workforce',
    items: [
      { label: 'Employees', href: ROUTES.employees, icon: UsersIcon },
      { label: 'Invitations', href: ROUTES.invitations, icon: MailPlusIcon },
    ],
  },
  {
    label: 'Payroll',
    items: [
      { label: 'Payroll runs', href: ROUTES.payroll, icon: WalletIcon },
      {
        label: 'Approvals',
        href: ROUTES.approvals,
        icon: ClipboardCheckIcon,
        badgeKey: 'approvals',
      },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { label: 'Audit logs', href: ROUTES.auditLogs, icon: ScrollTextIcon },
      {
        label: 'Notifications',
        href: ROUTES.notifications,
        icon: BellIcon,
        badgeKey: 'notifications',
      },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { label: 'Organization', href: ROUTES.settings, icon: Building2Icon },
      { label: 'Settings', href: ROUTES.settings, icon: SettingsIcon },
    ],
  },
];

function NavLink({
  href,
  label,
  icon: Icon,
  badge,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active =
    href === ROUTES.settings
      ? pathname.startsWith(ROUTES.settings)
      : pathname === href || pathname.startsWith(`${href}/`);

  const content = (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
        collapsed && 'justify-center px-2',
        active
          ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-sm'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {active ? (
        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />
      ) : null}
      <Icon className="size-4 shrink-0" aria-hidden />
      {!collapsed ? <span className="truncate">{label}</span> : null}
      {!collapsed && badge && badge > 0 ? (
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
      {collapsed && badge && badge > 0 ? (
        <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />
      ) : null}
    </Link>
  );

  if (!collapsed) return content;

  return (
    <Tooltip>
      <TooltipTrigger render={<div className="w-full" />}>{content}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
        {badge && badge > 0 ? ` (${badge})` : ''}
      </TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } =
    useUiStore();
  const approvals = useApprovals();
  const unread = useUnreadCount();

  const badges = {
    approvals: approvals.data?.length ?? 0,
    notifications: unread.data?.count ?? 0,
  };

  return (
    <TooltipProvider delay={200}>
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
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-200 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarCollapsed && 'lg:w-[4.25rem]'
        )}
        aria-label="Main navigation"
      >
        <div
          className={cn(
            'flex h-14 items-center gap-2 px-3',
            sidebarCollapsed ? 'justify-center' : 'justify-between px-4'
          )}
        >
          <Link
            href={ROUTES.dashboard}
            className="flex min-w-0 items-center gap-2.5 font-semibold tracking-tight text-sidebar-foreground"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm">
              V
            </span>
            {!sidebarCollapsed ? (
              <span className="truncate">
                VeilPay
                <span className="mt-0.5 block text-[10px] font-normal tracking-normal text-muted-foreground">
                  Payroll OS
                </span>
              </span>
            ) : null}
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

        <nav className="flex-1 space-y-5 overflow-y-auto p-2" aria-label="Dashboard">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="space-y-1">
              {!sidebarCollapsed ? (
                <p className="px-2.5 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {section.label}
                </p>
              ) : null}
              {section.items.map((item) => (
                <NavLink
                  key={`${section.label}-${item.href}-${item.label}`}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  badge={item.badgeKey ? badges[item.badgeKey] : undefined}
                  collapsed={sidebarCollapsed}
                  onNavigate={() => setSidebarOpen(false)}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-2">
          {!sidebarCollapsed && user ? (
            <div className="mb-2 rounded-lg bg-sidebar-accent/50 px-2.5 py-2">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {user.organizationName ?? 'Organization'}
              </p>
              <p className="truncate text-[11px] text-muted-foreground capitalize">
                {String(user.role).replaceAll('_', ' ').toLowerCase()}
              </p>
            </div>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'hidden w-full text-muted-foreground lg:flex',
              sidebarCollapsed ? 'justify-center px-0' : 'justify-between'
            )}
            onClick={toggleSidebarCollapsed}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {!sidebarCollapsed ? <span className="text-xs">Collapse</span> : null}
            {sidebarCollapsed ? (
              <ChevronRightIcon className="size-4" />
            ) : (
              <ChevronLeftIcon className="size-4" />
            )}
          </Button>
        </div>
        <span className="sr-only">Current path: {pathname}</span>
      </aside>
    </TooltipProvider>
  );
}
