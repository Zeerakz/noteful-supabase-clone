
import { PaginationOptions } from './types';

export class DatabaseQueryPagination {
  /**
   * Apply pagination to the query
   */
  static applyPagination(query: any, pagination?: PaginationOptions) {
    if (!pagination) {
      return query;
    }

    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    return query.range(from, to);
  }

  /**
   * Calculate pagination metadata
   */
  static calculatePaginationMeta(
    page: number,
    limit: number,
    totalCount: number
  ) {
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      totalPages
    };
  }
}
