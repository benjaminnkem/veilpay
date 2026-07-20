'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { getNavSectionsForRole } from '@/constants/navigation';
import { ROUTES } from '@/constants/routes';
import { useApprovals } from '@/features/approvals/hooks/use-approvals';
import { useUnreadCount } from '@/features/notifications/hooks/use-notifications';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { canViewApprovals, getHomeHref } from '@/lib/auth/rbac';

function isNavActive(pathname: string, href: string) {
  if (href === ROUTES.settings) {
    return pathname.startsWith(ROUTES.settings);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { isMobile, setOpenMobile } = useSidebar();
  const showApprovals = canViewApprovals(user?.role);
  const approvals = useApprovals({ enabled: showApprovals });
  const unread = useUnreadCount();

  const sections = getNavSectionsForRole(user?.role);
  const homeHref = getHomeHref(user?.role);

  const badges = {
    approvals: showApprovals ? (approvals.data?.length ?? 0) : 0,
    notifications: unread.data?.count ?? 0,
  };

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href={homeHref} />}
              tooltip="VeilPay"
              onClick={closeMobile}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                V
              </span>
              <span className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold tracking-tight">
                  VeilPay
                </span>
                <span className="truncate text-[10px] font-normal text-muted-foreground">
                  Payroll OS
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isNavActive(pathname, item.href);
                  const badge = item.badgeKey
                    ? badges[item.badgeKey]
                    : undefined;

                  return (
                    <SidebarMenuItem
                      key={`${section.label}-${item.href}-${item.label}`}
                    >
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={active}
                        tooltip={item.label}
                        onClick={closeMobile}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {badge != null && badge > 0 ? (
                        <SidebarMenuBadge className="bg-primary text-[10px] font-semibold text-primary-foreground">
                          {badge > 99 ? '99+' : badge}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <div className="rounded-lg bg-sidebar-accent/50 px-2.5 py-2 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              {user.organizationName ?? 'Organization'}
            </p>
            <p className="truncate text-[11px] text-muted-foreground capitalize">
              {String(user.role).replaceAll('_', ' ').toLowerCase()}
            </p>
          </div>
        ) : null}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
