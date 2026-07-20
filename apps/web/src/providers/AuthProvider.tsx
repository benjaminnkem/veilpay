'use client';

import { SessionProvider, signOut, useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { useEffect, type ReactNode } from 'react';

import {
  clearStoredTokens,
  onTokensChange,
  setStoredTokens,
} from '@/lib/auth/token-store';
import { ROUTES } from '@/constants/routes';

interface AuthProviderProps {
  children: ReactNode;
  session?: Session | null;
}

function AuthSessionSync({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();

  useEffect(() => {
    if (status !== 'authenticated' || !session) {
      return;
    }

    if (session.error === 'RefreshAccessTokenError') {
      clearStoredTokens();
      void signOut({ callbackUrl: ROUTES.login });
      return;
    }

    if (session.accessToken && session.refreshToken) {
      setStoredTokens({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        accessTokenExpires:
          session.accessTokenExpires ?? Date.now() + 15 * 60 * 1000,
      });
    }
  }, [session, status]);

  useEffect(() => {
    return onTokensChange((tokens) => {
      if (!tokens) return;
      void update({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpires: tokens.accessTokenExpires,
      });
    });
  }, [update]);

  return children;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus refetchInterval={4 * 60}>
      <AuthSessionSync>{children}</AuthSessionSync>
    </SessionProvider>
  );
}
