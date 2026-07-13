import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getSession } from 'next-auth/react';

import { clientEnv } from '@/config/env';
import { parseApiError } from '@/lib/errors';

export type AccessTokenResolver = () => Promise<string | null | undefined>;

let accessTokenResolver: AccessTokenResolver | null = null;

export function setAccessTokenResolver(resolver: AccessTokenResolver): void {
  accessTokenResolver = resolver;
}

async function resolveAccessToken(): Promise<string | null> {
  if (accessTokenResolver) {
    const token = await accessTokenResolver();
    return token ?? null;
  }

  if (typeof window !== 'undefined') {
    try {
      const session = await getSession();
      return session?.accessToken ?? null;
    } catch {
      return null;
    }
  }

  return null;
}

export const api: AxiosInstance = axios.create({
  baseURL: clientEnv.NEXT_PUBLIC_API_URL,
  timeout: 30_000,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await resolveAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (config.data !== undefined && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(parseApiError(error)),
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => Promise.reject(parseApiError(error)),
);

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<T>(config);
  return response.data;
}

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiRequest<T>({ ...config, method: 'GET', url });
}

export async function apiPost<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiRequest<T>({ ...config, method: 'POST', url, data });
}

export async function apiPut<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiRequest<T>({ ...config, method: 'PUT', url, data });
}

export async function apiPatch<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiRequest<T>({ ...config, method: 'PATCH', url, data });
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiRequest<T>({ ...config, method: 'DELETE', url });
}

export async function apiUpload<T>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiRequest<T>({
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

export default api;
