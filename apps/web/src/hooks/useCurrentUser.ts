'use client';

import { useSession } from 'next-auth/react';

import type { SessionUser } from '@/types/auth';

export function useCurrentUser() {
  const { data: session, status, update } = useSession();

  const user: SessionUser | null = session?.user ?? null;

  return {
    user,
    session,
    status,
    update,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated' && !!user,
    isUnauthenticated: status === 'unauthenticated',
    accessToken: session?.accessToken ?? user?.accessToken,
  };
}
