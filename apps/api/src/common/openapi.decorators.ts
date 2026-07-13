import { applyDecorators, HttpStatus, type Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from './openapi.models';

interface ApiEndpointOptions {
  summary: string;
  description: string;
  response: Type<unknown>;
  isArray?: boolean;
  created?: boolean;
  public?: boolean;
  idempotent?: boolean;
  params?: Array<{ name: string; description: string; format?: string }>;
}

export function ApiEndpoint(options: ApiEndpointOptions): MethodDecorator {
  const success = options.created
    ? ApiCreatedResponse({
        description: 'Request completed successfully.',
        type: options.response,
        isArray: options.isArray,
      })
    : ApiOkResponse({
        description: 'Request completed successfully.',
        type: options.response,
        isArray: options.isArray,
      });

  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
    success,
    ApiBadRequestResponse({
      description:
        'Validation, state-machine, signature, or blockchain verification failure.',
      type: ApiErrorResponseDto,
    }),
    ...(options.public
      ? []
      : [
          ApiUnauthorizedResponse({
            description: 'Missing, expired, or invalid bearer token.',
            type: ApiErrorResponseDto,
          }),
          ApiForbiddenResponse({
            description:
              'The caller lacks the required company role or resource access.',
            type: ApiErrorResponseDto,
          }),
        ]),
    ApiNotFoundResponse({
      description: 'The requested tenant-scoped resource does not exist.',
      type: ApiErrorResponseDto,
    }),
    ApiConflictResponse({
      description:
        'Uniqueness, replay, idempotency, or concurrent-state conflict.',
      type: ApiErrorResponseDto,
    }),
    ...(options.idempotent
      ? [
          ApiHeader({
            name: 'Idempotency-Key',
            required: true,
            description:
              'Opaque client-generated key. Retry the identical operation with the same key; use a new key for a different payload.',
            schema: { type: 'string', minLength: 1, maxLength: 255 },
            example: 'payroll-prepare-2026-07-v1',
          }),
          ApiResponse({
            status: HttpStatus.CONFLICT,
            description:
              'The key is already in progress or was reused with a different request body.',
            type: ApiErrorResponseDto,
          }),
        ]
      : []),
    ...(options.params ?? []).map((param) =>
      ApiParam({
        name: param.name,
        description: param.description,
        schema: {
          type: 'string',
          format: param.format ?? 'uuid',
        },
      }),
    ),
  );
}

export const companyParam = {
  name: 'companyId',
  description:
    'Tenant company UUID. Access is checked against active membership and RBAC.',
  format: 'uuid',
};
export const payrollParam = {
  name: 'id',
  description: 'Payroll run UUID scoped to companyId.',
  format: 'uuid',
};
