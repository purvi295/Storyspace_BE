import { PAGINATION } from '../config/constants';
import { PaginationMeta } from './api.response';

/**
 * Interface for paginated response.
 */
export interface IPaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Options for pagination calculation.
 */
export interface IPaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Calculate pagination metadata.
 *
 * @param total - Total number of items
 * @param options - Pagination options (page, limit)
 * @returns Pagination metadata
 */
export function calculatePagination(
  total: number,
  options: IPaginationOptions = {},
): PaginationMeta {
  const page = Math.max(options.page || PAGINATION.DEFAULT_PAGE, 1);
  const limit = Math.min(
    Math.max(options.limit || PAGINATION.DEFAULT_LIMIT, 1),
    PAGINATION.MAX_LIMIT,
  );
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  };
}

/**
 * Calculate skip value for TypeORM queries.
 *
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Number of items to skip
 */
export function calculateSkip(page: number, limit: number): number {
  return (Math.max(page, 1) - 1) * limit;
}


