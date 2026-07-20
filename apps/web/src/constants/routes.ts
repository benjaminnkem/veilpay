export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/unauthorized',
  '/invite',
] as const;

export const AUTH_ROUTES = ['/login', '/register', '/forgot-password'] as const;

export const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/employees',
  '/payroll',
  '/approvals',
  '/audit-logs',
  '/settings',
  '/notifications',
  '/invitations',
  '/profile',
] as const;

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  unauthorized: '/unauthorized',
  dashboard: '/dashboard',
  employees: '/employees',
  payroll: '/payroll',
  approvals: '/approvals',
  auditLogs: '/audit-logs',
  settings: '/settings',
  notifications: '/notifications',
  invitations: '/invitations',
  profile: '/profile',
  invite: '/invite',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}
