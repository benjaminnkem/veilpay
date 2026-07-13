import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from './auth-context';

export function requestIdMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const supplied = req.header('x-request-id');
  req.requestId =
    supplied && /^[A-Za-z0-9._-]{1,100}$/.test(supplied)
      ? supplied
      : randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
}

export function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_, item: unknown) =>
      typeof item === 'bigint' ? item.toString() : item,
    ),
  ) as T;
}
