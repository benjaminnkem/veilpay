import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  Observable,
  catchError,
  concatMap,
  from,
  map,
  of,
  throwError,
} from 'rxjs';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedRequest } from '../common/auth-context';
import { IdempotencyService } from './idempotency.service';

const IDEMPOTENT_WRITES: RegExp[] = [
  /^\/companies$/,
  /^\/companies\/[^/]+\/invitations$/,
  /^\/companies\/[^/]+\/safe\/deployment-intents(?:\/[^/]+\/submit)?$/,
  /^\/companies\/[^/]+\/treasury\/funding-intents(?:\/[^/]+\/submit)?$/,
  /^\/companies\/[^/]+\/payroll-runs(?:\/[^/]+\/(?:prepare|safe-transaction|propose|sync-safe-approval|execute|cancel|reconcile))?$/,
];

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value, (_key, item: unknown) =>
      typeof item === 'bigint' ? item.toString() : item,
    ),
  ) as Prisma.InputJsonValue;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotency: IdempotencyService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (
      request.method !== 'POST' ||
      !IDEMPOTENT_WRITES.some((pattern) => pattern.test(request.path))
    )
      return next.handle();

    const user = request.user;
    if (!user) return next.handle();
    const keyHeader = request.headers['idempotency-key'];
    const key = Array.isArray(keyHeader) ? keyHeader[0] : keyHeader;
    const rawCompanyId = request.params.companyId;
    const companyId = Array.isArray(rawCompanyId)
      ? (rawCompanyId[0] ?? null)
      : (rawCompanyId ?? null);
    const operation = `${request.method}:${request.path}`;
    const attempt = await this.idempotency.begin(
      user.id,
      companyId,
      operation,
      key ?? '',
      request.body,
    );
    const response = context.switchToHttp().getResponse<Response>();
    if (attempt.replay) {
      response.status(attempt.responseStatus ?? 200);
      response.setHeader('Idempotent-Replayed', 'true');
      return of(attempt.responseBody);
    }
    return next.handle().pipe(
      concatMap((body: unknown) =>
        from(
          this.idempotency.complete(
            attempt.id,
            response.statusCode,
            jsonValue(body),
          ),
        ).pipe(map(() => body)),
      ),
      catchError((error: unknown) =>
        from(this.idempotency.abandon(attempt.id)).pipe(
          concatMap(() => throwError(() => error)),
        ),
      ),
    );
  }
}
