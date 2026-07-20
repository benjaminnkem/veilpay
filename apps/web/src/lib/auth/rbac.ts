import type { UserRole } from '@repo/types';

import { ROUTES } from '@/constants/routes';

export type AppRole = UserRole | string;

const ALL_ORG_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'OWNER',
  'HR',
  'FINANCE',
  'CEO',
  'AUDITOR',
  'EMPLOYEE',
];

const OPS_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'OWNER',
  'HR',
  'FINANCE',
  'CEO',
  'AUDITOR',
];

const ADMIN_HR_ROLES: AppRole[] = ['SUPER_ADMIN', 'OWNER', 'HR'];

const APPROVER_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'OWNER',
  'HR',
  'FINANCE',
  'CEO',
];

const TREASURY_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'OWNER',
  'FINANCE',
  'CEO',
  'AUDITOR',
];

const ORG_SETTINGS_WRITE_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'OWNER',
  'CEO',
];

/** Roles that may load org-wide dashboard stats. */
export const DASHBOARD_STATS_ROLES = OPS_ROLES;

/** Sidebar / page access matrix aligned with API @Roles. */
export const ROUTE_ROLES: Record<string, AppRole[]> = {
  [ROUTES.dashboard]: ALL_ORG_ROLES,
  [ROUTES.employees]: OPS_ROLES,
  [ROUTES.invitations]: ADMIN_HR_ROLES,
  [ROUTES.payroll]: OPS_ROLES,
  [ROUTES.approvals]: APPROVER_ROLES,
  [ROUTES.auditLogs]: OPS_ROLES,
  [ROUTES.notifications]: ALL_ORG_ROLES,
  [ROUTES.settings]: ALL_ORG_ROLES,
  [ROUTES.profile]: ALL_ORG_ROLES,
};

export function normalizeRole(role?: string | null): AppRole {
  return (role ?? 'EMPLOYEE').toUpperCase();
}

export function roleIn(role: string | null | undefined, allowed: AppRole[]) {
  const r = normalizeRole(role);
  return allowed.includes(r);
}

export function canAccessPath(
  role: string | null | undefined,
  pathname: string,
): boolean {
  const r = normalizeRole(role);

  const match = Object.entries(ROUTE_ROLES).find(
    ([href]) => pathname === href || pathname.startsWith(`${href}/`),
  );

  if (!match) {
    return true;
  }

  return match[1].includes(r);
}

export function canViewDashboardStats(role?: string | null) {
  return roleIn(role, DASHBOARD_STATS_ROLES);
}

export function canManageInvitations(role?: string | null) {
  return roleIn(role, ADMIN_HR_ROLES);
}

export function canViewApprovals(role?: string | null) {
  return roleIn(role, APPROVER_ROLES);
}

export function canViewEmployees(role?: string | null) {
  return roleIn(role, OPS_ROLES);
}

export function canViewPayroll(role?: string | null) {
  return roleIn(role, OPS_ROLES);
}

export function canViewAuditLogs(role?: string | null) {
  return roleIn(role, OPS_ROLES);
}

export function canManageTreasury(role?: string | null) {
  return roleIn(role, TREASURY_ROLES);
}

export function canEditOrgSettings(role?: string | null) {
  return roleIn(role, ORG_SETTINGS_WRITE_ROLES);
}

export function isEmployeeRole(role?: string | null) {
  return normalizeRole(role) === 'EMPLOYEE';
}

export function getHomeHref(role?: string | null) {
  return ROUTES.dashboard;
}

export function getDefaultDeniedRedirect(role?: string | null) {
  if (isEmployeeRole(role)) return ROUTES.settings;
  return ROUTES.dashboard;
}
