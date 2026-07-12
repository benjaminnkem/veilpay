'use client';

import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';

import { parseApiError, type ApiError } from '@/lib/errors';

export function useApiMutation<
  TData = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, ApiError, TVariables, TContext>
): UseMutationResult<TData, ApiError, TVariables, TContext> {
  const { mutationFn, ...rest } = options;

  return useMutation<TData, ApiError, TVariables, TContext>({
    ...rest,
    mutationFn: mutationFn
      ? async (variables, context) => {
          try {
            return await mutationFn(variables, context);
          } catch (error) {
            throw parseApiError(error);
          }
        }
      : undefined,
  });
}
