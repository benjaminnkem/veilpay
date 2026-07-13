import {
  CallHandler,
  ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import { jsonSafe } from './http';

@Injectable()
export class JsonSafeInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((body: unknown) => jsonSafe(body)));
  }
}
