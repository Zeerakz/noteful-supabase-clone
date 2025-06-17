
import { supabase } from '@/integrations/supabase/client';
import { DatabaseQueryFilters } from './queryFilters';
import { DatabaseQuerySorting } from './querySorting';
import { DatabaseQueryPagination } from './queryPagination';
import { DatabaseQueryParams, QueryOptions } from './types';

export class DatabaseQueryBuilder {
  /**
   * Build a complete database query with filters, sorting, and pagination
   */
  static buildQuery(params: DatabaseQueryParams) {
    const { databaseId, filterGroup, fields, sortRules, userId, options = {} } = params;

    if (!databaseId || databaseId === 'null' || databaseId === 'undefined') {
      throw new Error('Invalid database ID');
    }

    // Build base query
    let query = supabase
      .from('blocks')
      .select('*', { count: options.enableCounting ? 'exact' : undefined })
      .eq('properties->>database_id', databaseId)
      .eq('type', 'page')
      .is('in_trash', false);

    // Apply filters
    query = DatabaseQueryFilters.applyFilters(query, filterGroup, fields, userId);

    // Apply sorting
    query = DatabaseQuerySorting.applySorting(query, sortRules, fields);

    // Apply pagination
    query = DatabaseQueryPagination.applyPagination(query, options.pagination);

    return query;
  }

  /**
   * Build a count-only query for pagination
   */
  static buildCountQuery(params: Omit<DatabaseQueryParams, 'options'>) {
    const { databaseId, filterGroup, fields, userId } = params;

    let query = supabase
      .from('blocks')
      .select('*', { count: 'exact', head: true })
      .eq('properties->>database_id', databaseId)
      .eq('type', 'page')
      .is('in_trash', false);

    // Apply filters (but not sorting or pagination for count)
    query = DatabaseQueryFilters.applyFilters(query, filterGroup, fields, userId);

    return query;
  }
}
