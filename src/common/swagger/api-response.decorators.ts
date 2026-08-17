import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProperty,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';

/**
 * Every response passes through TransformInterceptor, so the documented
 * schema has to describe the envelope rather than the bare model — otherwise
 * the docs would describe an API that does not exist.
 *
 *   single item   { "data": { … } }
 *   list          { "data": [ … ], "meta": { … } }
 */

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 70, description: 'Matching documents, not just this page' })
  total: number;

  @ApiProperty({ example: 7 })
  totalPages: number;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 403 })
  statusCode: number;

  @ApiProperty({
    example: 'Requires one of roles: admin',
    description: 'A string, or an array of strings for validation failures',
  })
  message: string | string[];
}

/** `{ data: Model }` — the shape of every single-item response. */
export function ApiDataResponse<TModel extends Type<unknown>>(
  model: TModel,
  options: { created?: boolean; description?: string } = {},
) {
  const Response = options.created ? ApiCreatedResponse : ApiOkResponse;
  return applyDecorators(
    ApiExtraModels(model),
    Response({
      description: options.description,
      schema: {
        properties: { data: { $ref: getSchemaPath(model) } },
      },
    }),
  );
}

/** `{ data: Model[], meta: PaginationMeta }` — every list response. */
export function ApiPaginatedResponse<TModel extends Type<unknown>>(
  model: TModel,
  description?: string,
) {
  return applyDecorators(
    ApiExtraModels(model, PaginationMetaDto),
    ApiOkResponse({
      description,
      schema: {
        properties: {
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
          meta: { $ref: getSchemaPath(PaginationMetaDto) },
        },
      },
    }),
  );
}

/**
 * Applied at controller level: the failures every authenticated route shares.
 * Documenting them once keeps each operation's decorator list about the
 * endpoint itself rather than about boilerplate.
 */
export function ApiAuthFailures() {
  return applyDecorators(
    ApiUnauthorizedResponse({
      description: 'Missing, invalid, expired — or revoked, because the account was deleted',
      type: ErrorResponseDto,
    }),
    ApiTooManyRequestsResponse({
      description: 'Rate limit exceeded',
      type: ErrorResponseDto,
    }),
  );
}

export function ApiAdminOnly() {
  return ApiForbiddenResponse({
    description: 'Authenticated, but not an admin',
    type: ErrorResponseDto,
  });
}

export function ApiValidationFailure() {
  return ApiBadRequestResponse({
    description: 'Validation failed, or the id is not a valid ObjectId',
    type: ErrorResponseDto,
  });
}

export function ApiMissing(what: string) {
  return ApiNotFoundResponse({
    description: `${what} does not exist — or belongs to another user, which is reported identically`,
    type: ErrorResponseDto,
  });
}

export function ApiDuplicateEmail() {
  return ApiConflictResponse({
    description: 'That email is already registered',
    type: ErrorResponseDto,
  });
}
