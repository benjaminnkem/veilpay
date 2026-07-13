import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedRequest } from './auth-context';

interface NestErrorBody {
  code?: unknown;
  message?: unknown;
  error?: unknown;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    console.log(exception);
    const context = host.switchToHttp();
    const request = context.getRequest<AuthenticatedRequest>();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const body: NestErrorBody =
      typeof raw === 'object' && raw !== null ? raw : { message: raw };
    const validationMessages = Array.isArray(body.message)
      ? body.message.filter((item): item is string => typeof item === 'string')
      : undefined;
    const safeMessage =
      status === 500
        ? 'Internal server error'
        : validationMessages?.length
          ? 'Request validation failed'
          : typeof body.message === 'string'
            ? body.message
            : typeof body.error === 'string'
              ? body.error
              : 'Request failed';

    if (status >= 500)
      this.logger.error(
        `Request failed requestId=${request.requestId ?? 'unknown'} status=${status}`,
      );

    response.status(status).json({
      code:
        typeof body.code === 'string'
          ? body.code
          : validationMessages
            ? 'VALIDATION_ERROR'
            : `HTTP_${status}`,
      message: safeMessage,
      ...(validationMessages ? { details: validationMessages } : {}),
      statusCode: status,
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }
}
