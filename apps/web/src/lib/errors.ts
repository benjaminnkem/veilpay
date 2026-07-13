import axios from 'axios';

import type { ApiErrorBody } from '@/types/api';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly isApiError = true as const;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: string;
      fieldErrors?: Record<string, string[]>;
    },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status ?? 500;
    this.code = options?.code;
    this.fieldErrors = options?.fieldErrors;
  }
}

const DEFAULT_ERROR_MESSAGE =
  'Something went wrong. Please try again in a moment.';

const STATUS_MESSAGES: Record<number, string> = {
  400: 'The request could not be processed. Please check your input.',
  401: 'You need to sign in to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with the current state.',
  422: 'Please fix the highlighted fields and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'An unexpected server error occurred.',
  502: 'The service is temporarily unavailable.',
  503: 'The service is temporarily unavailable.',
};

function normalizeFieldErrors(
  errors?: Record<string, string[] | string>,
): Record<string, string[]> | undefined {
  if (!errors) return undefined;

  const normalized: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(errors)) {
    normalized[key] = Array.isArray(value) ? value : [value];
  }

  return normalized;
}

function extractMessage(
  body: ApiErrorBody | undefined,
  status: number,
): string {
  if (body?.message && typeof body.message === 'string') {
    return body.message;
  }

  if (body?.error && typeof body.error === 'string') {
    return body.error;
  }

  return STATUS_MESSAGES[status] ?? DEFAULT_ERROR_MESSAGE;
}

export function parseApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return new ApiError(
        'Unable to reach the server. Check your connection and try again.',
        { status: 0, code: 'NETWORK_ERROR' },
      );
    }

    if (error.code === 'ECONNABORTED') {
      return new ApiError('The request timed out. Please try again.', {
        status: 408,
        code: 'TIMEOUT',
      });
    }

    const status = error.response?.status ?? 500;
    const body = error.response?.data as ApiErrorBody | undefined;

    return new ApiError(extractMessage(body, status), {
      status,
      code: body?.code,
      fieldErrors: normalizeFieldErrors(body?.errors),
    });
  }

  if (error instanceof Error) {
    return new ApiError(error.message || DEFAULT_ERROR_MESSAGE, {
      status: 500,
    });
  }

  return new ApiError(DEFAULT_ERROR_MESSAGE, { status: 500 });
}

export function getErrorMessage(error: unknown): string {
  return parseApiError(error).message;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
