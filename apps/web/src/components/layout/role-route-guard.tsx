'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  canAccessPath,
  getDefaultDeniedRedirect,
} from '@/lib/auth/rbac';

export function RoleRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (canAccessPath(user.role, pathname)) return;

    router.replace(getDefaultDeniedRedirect(user.role));
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (!isLoading && isAuthenticated && user && !canAccessPath(user.role, pathname)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Redirecting to a page you can access…
      </div>
    );
  }

  return <>{children}</>;
}
