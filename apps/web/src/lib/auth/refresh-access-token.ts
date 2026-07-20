import { clientEnv } from '@/config/env';
import {
  setStoredTokens,
  tokensFromAuthResponse,
  type StoredTokens,
} from '@/lib/auth/token-store';

interface RefreshableToken {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  error?: string;
  [key: string]: unknown;
}

export async function refreshAccessToken<T extends RefreshableToken>(
  token: T
): Promise<T> {
  if (!token.refreshToken) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }

  try {
    const response = await fetch(
      `${clientEnv.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: token.refreshToken }),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`Refresh failed with status ${response.status}`);
    }

    const data = (await response.json()) as {
      accessToken: string;
      refreshToken?: string;
      expiresIn?: number;
    };

    const stored = tokensFromAuthResponse({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      previousRefreshToken: token.refreshToken,
    });

    if (stored) {
      setStoredTokens(stored);
    }

    return {
      ...token,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? token.refreshToken,
      accessTokenExpires:
        stored?.accessTokenExpires ??
        Date.now() + (data.expiresIn ?? 900) * 1000,
      error: undefined,
    };
  } catch {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export function isAccessTokenFresh(
  accessTokenExpires?: number,
  skewMs = 60_000
): boolean {
  if (!accessTokenExpires) return false;
  return Date.now() < accessTokenExpires - skewMs;
}

export type { StoredTokens };
