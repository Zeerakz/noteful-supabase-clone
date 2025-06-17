
import { DatabaseQueryBuilder } from './queryBuilder';
import { DatabaseQueryPagination } from './queryPagination';
import { DatabaseQueryParams, DatabaseQueryResponse } from './types';

export * from './types';

export class EnhancedDatabaseQueryService {
  /**
   * Fetch database pages with server-side pagination and sorting
   */
  static async fetchDatabasePages(
    databaseId: string,
    filterGroup: any,
    fields: any[],
    sortRules: any[],
    userId?: string,
    options: any = {}
  ): Promise<DatabaseQueryResponse> {
    try {
      const params: DatabaseQueryParams = {
        databaseId,
        filterGroup,
        fields,
        sortRules,
        userId,
        options
      };

      const query = DatabaseQueryBuilder.buildQuery(params);
      const { data, error, count } = await query;

      if (error) throw error;

      const result: any = {
        data: data || [],
        error: null
      };

      if (options.enableCounting && count !== null) {
        result.totalCount = count;
        
        if (options.pagination) {
          const { page, limit } = options.pagination;
          const paginationMeta = DatabaseQueryPagination.calculatePaginationMeta(page, limit, count);
          result.hasNextPage = paginationMeta.hasNextPage;
          result.hasPreviousPage = paginationMeta.hasPreviousPage;
        }
      }

      return result;
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to fetch database pages',
      };
    }
  }

  /**
   * Get total count for a database (optimized query)
   */
  static async getDatabasePageCount(
    databaseId: string,
    filterGroup: any = {},
    userId?: string
  ): Promise<number> {
    try {
      const params: DatabaseQueryParams = {
        databaseId,
        filterGroup,
        fields: [],
        sortRules: [],
        userId,
        options: { enableCounting: true }
      };

      const query = DatabaseQueryBuilder.buildCountQuery(params);
      const { count, error } = await query;

      if (error) throw error;

      return count || 0;
    } catch (err) {
      console.error('Error getting database page count:', err);
      return 0;
    }
  }
}
