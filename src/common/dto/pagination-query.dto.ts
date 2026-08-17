import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

function meta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

/** Pagination for plain find() queries: page and count run concurrently. */
export async function paginate<T>(
  query: Promise<T[]>,
  countQuery: Promise<number>,
  page: number,
  limit: number,
): Promise<PaginatedResult<T>> {
  const [data, total] = await Promise.all([query, countQuery]);
  return { data, meta: meta(page, limit, total) };
}

/**
 * Pagination for aggregations. $facet runs the page slice and the total count
 * as two branches of the *same* pipeline, which is what lets these endpoints
 * paginate while still honouring the "exactly one aggregate() call" rule.
 */
export function pageSlice(page: number, limit: number) {
  return [{ $skip: (page - 1) * limit }, { $limit: limit }];
}

export const totalBranch = [{ $count: 'value' }];

export function paginatedFacet(page: number, limit: number) {
  return { data: pageSlice(page, limit), total: totalBranch };
}

export function unwrapFacet<T>(
  result: { data: T[]; total: { value: number }[] } | undefined,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const total = result?.total[0]?.value ?? 0;
  return { data: result?.data ?? [], meta: meta(page, limit, total) };
}
