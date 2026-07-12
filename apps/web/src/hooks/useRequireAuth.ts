'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface UseRequireAuthOptions {
  redirectTo?: string;
  enabled?: boolean;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { redirectTo = ROUTES.login, enabled = true } = options;
  const { user, status, isAuthenticated, isLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled || isLoading) return;

    if (!isAuthenticated) {
      const callbackUrl = encodeURIComponent(pathname);
      router.replace(`${redirectTo}?callbackUrl=${callbackUrl}`);
    }
  }, [enabled, isAuthenticated, isLoading, pathname, redirectTo, router]);

  return {
    user,
    status,
    isAuthenticated,
    isLoading,
  };
}
