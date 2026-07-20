import type { ComponentType } from 'react';
import {
  BellIcon,
  Building2Icon,
  ClipboardCheckIcon,
  LayoutDashboardIcon,
  MailPlusIcon,
  ScrollTextIcon,
  SettingsIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react';

import { ROUTES } from '@/constants/routes';
import {
  canAccessPath,
  normalizeRole,
  type AppRole,
} from '@/lib/auth/rbac';

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badgeKey?: 'approvals' | 'notifications';
};

export type NavSection = {
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
      { label: 'Settings', href: ROUTES.settings, icon: SettingsIcon },
      { label: 'Profile', href: ROUTES.profile, icon: Building2Icon },
    ],
  },
];

export function getNavSectionsForRole(
  role?: string | null,
): NavSection[] {
  const r = normalizeRole(role);

  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canAccessPath(r, item.href)),
  })).filter((section) => section.items.length > 0);
}

export type { AppRole };
