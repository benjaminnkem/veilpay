import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { clientEnv } from '@/config/env';
import { parseApiError } from '@/lib/errors';

const DEFAULT_HEADERS = {
  Accept: 'application/json',
} as const;

export type AuthRefreshHandler = (
  failedRequest: InternalAxiosRequestConfig
) => Promise<InternalAxiosRequestConfig | null>;

export function createBaseClient(): AxiosInstance {
  return axios.create({
    baseURL: clientEnv.NEXT_PUBLIC_API_URL,
    timeout: 30_000,
    headers: { ...DEFAULT_HEADERS },
  });
}

function applyContentType(config: InternalAxiosRequestConfig): void {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (config.data !== undefined && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
}

export function attachPublicInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      applyContentType(config);
      return config;
    },
    (error: AxiosError) => Promise.reject(parseApiError(error))
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => Promise.reject(parseApiError(error))
  );
}

export function attachAuthInterceptors(
  instance: AxiosInstance,
  resolveAccessToken: () => Promise<string | null>,
  onUnauthorized?: AuthRefreshHandler
): void {
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await resolveAccessToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      applyContentType(config);
      return config;
    },
    (error: AxiosError) => Promise.reject(parseApiError(error))
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const original = error.config as
        | (InternalAxiosRequestConfig & { _retry?: boolean })
        | undefined;

      if (
        error.response?.status === 401 &&
        original &&
        !original._retry &&
        onUnauthorized
      ) {
        original._retry = true;
        try {
          const nextConfig = await onUnauthorized(original);
          if (nextConfig) {
            return instance.request(nextConfig);
          }
        } catch {
          return Promise.reject(parseApiError(error));
        }
      }

      return Promise.reject(parseApiError(error));
    }
  );
}

export async function requestWithClient<T>(
  client: AxiosInstance,
  config: AxiosRequestConfig
): Promise<T> {
  const response = await client.request<T>(config);
  return response.data;
}
