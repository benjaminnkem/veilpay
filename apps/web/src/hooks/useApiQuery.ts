'use client';

import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import { parseApiError, type ApiError } from '@/lib/errors';

export function useApiQuery<
  TQueryFnData = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, ApiError, TData, TQueryKey>
): UseQueryResult<TData, ApiError> {
  const { queryFn, ...rest } = options;

  return useQuery<TQueryFnData, ApiError, TData, TQueryKey>({
    ...rest,
    queryFn: queryFn
      ? async (context) => {
          try {
            if (typeof queryFn === 'function') {
              return await queryFn(context);
            }
            throw new Error('Invalid query function');
          } catch (error) {
            throw parseApiError(error);
          }
        }
      : undefined,
  });
}
