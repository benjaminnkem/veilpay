import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';

import { clientEnv } from '@/config/env';
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredTokens,
  setStoredTokens,
  tokensFromAuthResponse,
} from '@/lib/auth/token-store';
import {
  attachAuthInterceptors,
  createBaseClient,
  requestWithClient,
} from './create-client';

export type AccessTokenResolver = () => Promise<string | null | undefined>;

let accessTokenResolver: AccessTokenResolver | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessTokenResolver(resolver: AccessTokenResolver): void {
  accessTokenResolver = resolver;
}

async function resolveAccessToken(): Promise<string | null> {
  const cached = getStoredAccessToken();
  const stored = getStoredTokens();
  if (cached && stored && Date.now() < stored.accessTokenExpires - 15_000) {
    return cached;
  }

  if (accessTokenResolver) {
    const token = await accessTokenResolver();
    return token ?? null;
  }

  if (typeof window !== 'undefined') {
    try {
      const session = await getSession();
      if (session?.accessToken && session.refreshToken) {
        setStoredTokens({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          accessTokenExpires:
            session.accessTokenExpires ?? Date.now() + 15 * 60 * 1000,
        });
      }
      return session?.accessToken ?? null;
    } catch {
      return null;
    }
  }

  return null;
}

async function resolveRefreshToken(): Promise<string | null> {
  const cached = getStoredRefreshToken();
  if (cached) return cached;

  if (typeof window !== 'undefined') {
    try {
      const session = await getSession();
      return session?.refreshToken ?? null;
    } catch {
      return null;
    }
  }

  return null;
}

async function performTokenRefresh(): Promise<string | null> {
  const refreshToken = await resolveRefreshToken();
  if (!refreshToken) {
    return null;
  }

  const response = await fetch(
    `${clientEnv.NEXT_PUBLIC_API_URL}/auth/refresh`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    setStoredTokens(null);
    if (typeof window !== 'undefined') {
      await signOut({ callbackUrl: '/login' });
    }
    return null;
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
    previousRefreshToken: refreshToken,
  });

  if (stored) {
    setStoredTokens(stored);
    return stored.accessToken;
  }

  return data.accessToken;
}

export async function ensureFreshAccessToken(): Promise<string | null> {
  const stored = getStoredTokens();
  if (stored && Date.now() < stored.accessTokenExpires - 60_000) {
    return stored.accessToken;
  }

  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function handleUnauthorized(
  failedRequest: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig | null> {
  const accessToken = await ensureFreshAccessToken();
  if (!accessToken) {
    return null;
  }

  failedRequest.headers.Authorization = `Bearer ${accessToken}`;
  return failedRequest;
}

export const authApi: AxiosInstance = createBaseClient();
attachAuthInterceptors(authApi, resolveAccessToken, handleUnauthorized);

export async function authRequest<T>(
  config: AxiosRequestConfig
): Promise<T> {
  return requestWithClient<T>(authApi, config);
}

export async function authGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return authRequest<T>({ ...config, method: 'GET', url });
}

export async function authPost<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  return authRequest<T>({ ...config, method: 'POST', url, data });
}

export async function authPut<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  return authRequest<T>({ ...config, method: 'PUT', url, data });
}

export async function authPatch<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  return authRequest<T>({ ...config, method: 'PATCH', url, data });
}

export async function authDelete<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return authRequest<T>({ ...config, method: 'DELETE', url });
}

export async function authUpload<T>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig
): Promise<T> {
  return authRequest<T>({
    ...config,
    method: 'POST',
    url,
    data: formData,
    headers: {
      ...config?.headers,
      'Content-Type': 'multipart/form-data',
    },
  });
}
