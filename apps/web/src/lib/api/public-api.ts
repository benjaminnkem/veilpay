import type { AxiosInstance, AxiosRequestConfig } from 'axios';

import {
  attachPublicInterceptors,
  createBaseClient,
  requestWithClient,
} from './create-client';

export const publicApi: AxiosInstance = createBaseClient();
attachPublicInterceptors(publicApi);

export async function publicRequest<T>(
  config: AxiosRequestConfig
): Promise<T> {
  return requestWithClient<T>(publicApi, config);
}

export async function publicGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return publicRequest<T>({ ...config, method: 'GET', url });
}

export async function publicPost<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  return publicRequest<T>({ ...config, method: 'POST', url, data });
}

export async function publicPut<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  return publicRequest<T>({ ...config, method: 'PUT', url, data });
}

export async function publicPatch<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  return publicRequest<T>({ ...config, method: 'PATCH', url, data });
}

export async function publicDelete<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return publicRequest<T>({ ...config, method: 'DELETE', url });
}
