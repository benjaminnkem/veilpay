import { getSession, signOut } from 'next-auth/react';

import { authPost } from '@/lib/api';
import { clearStoredTokens, getStoredRefreshToken } from '@/lib/auth/token-store';
import { ROUTES } from '@/constants/routes';

export async function logout(): Promise<void> {
  const refreshToken =
    getStoredRefreshToken() ??
    (typeof window !== 'undefined'
      ? (await getSession())?.refreshToken
      : undefined);

  try {
    await authPost('/auth/logout', refreshToken ? { refreshToken } : {});
  } catch {
  } finally {
    clearStoredTokens();
    await signOut({ callbackUrl: ROUTES.login });
  }
}
