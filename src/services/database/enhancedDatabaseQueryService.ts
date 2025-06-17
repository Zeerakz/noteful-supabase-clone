
import { supabase } from '@/integrations/supabase/client';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { Block } from '@/types/block';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface QueryResult {
  data: Block[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface QueryOptions {
  pagination?: PaginationOptions;
  enableCounting?: boolean;
}

export class EnhancedDatabaseQueryService {
  /**
   * Fetch database pages with server-side pagination and sorting
   */
  static async fetchDatabasePages(
    databaseId: string,
    filterGroup: FilterGroup,
    fields: DatabaseField[],
    sortRules: SortRule[],
    userId?: string,
    options: QueryOptions = {}
  ): Promise<{ data: Block[] | null; error: string | null; totalCount?: number; hasNextPage?: boolean; hasPreviousPage?: boolean }> {
    try {
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
      query = this.applyFilters(query, filterGroup, fields, userId);

      // Apply sorting
      query = this.applySorting(query, sortRules, fields);

      // Apply pagination
      if (options.pagination) {
        const { page, limit } = options.pagination;
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const result: any = {
        data: (data as Block[]) || [],
        error: null
      };

      if (options.enableCounting && count !== null) {
        result.totalCount = count;
        
        if (options.pagination) {
          const { page, limit } = options.pagination;
          const totalPages = Math.ceil(count / limit);
          result.hasNextPage = page < totalPages;
          result.hasPreviousPage = page > 1;
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
   * Apply filters to the query
   */
  private static applyFilters(
    query: any,
    filterGroup: FilterGroup,
    fields: DatabaseField[],
    userId?: string
  ) {
    if (!filterGroup.rules || filterGroup.rules.length === 0) {
      return query;
    }

    // For complex filtering, we'll build a more sophisticated filter system
    // For now, implement basic text and select filters
    filterGroup.rules.forEach(rule => {
      const field = fields.find(f => f.id === rule.fieldId);
      if (!field) return;

      const propertyPath = `properties->${rule.fieldId}`;

      switch (rule.operator) {
        case 'equals':
          if (rule.value === 'me' && userId) {
            query = query.eq(propertyPath, userId);
          } else {
            query = query.eq(propertyPath, rule.value);
          }
          break;
        case 'not_equals':
          if (rule.value === 'me' && userId) {
            query = query.neq(propertyPath, userId);
          } else {
            query = query.neq(propertyPath, rule.value);
          }
          break;
        case 'contains':
          query = query.ilike(propertyPath, `%${rule.value}%`);
          break;
        case 'not_contains':
          query = query.not('properties', 'cs', `{"${rule.fieldId}": "${rule.value}"}`);
          break;
        case 'is_empty':
          query = query.or(`properties->${rule.fieldId}.is.null,properties->${rule.fieldId}.eq.""`);
          break;
        case 'is_not_empty':
          query = query.not('properties', 'cs', `{"${rule.fieldId}": null}`)
                      .not('properties', 'cs', `{"${rule.fieldId}": ""}`);
          break;
        case 'is_greater_than':
          if (field.type === 'date') {
            query = query.gt(propertyPath, rule.value);
          } else if (field.type === 'number') {
            query = query.gt(`(${propertyPath})::numeric`, parseFloat(rule.value));
          }
          break;
        case 'is_less_than':
          if (field.type === 'date') {
            query = query.lt(propertyPath, rule.value);
          } else if (field.type === 'number') {
            query = query.lt(`(${propertyPath})::numeric`, parseFloat(rule.value));
          }
          break;
      }
    });

    return query;
  }

  /**
   * Apply sorting to the query
   */
  private static applySorting(
    query: any,
    sortRules: SortRule[],
    fields: DatabaseField[]
  ) {
    if (!sortRules || sortRules.length === 0) {
      // Default sorting by creation time
      return query.order('created_time', { ascending: false });
    }

    sortRules.forEach(rule => {
      const field = fields.find(f => f.id === rule.fieldId);
      if (!field) return;

      const ascending = rule.direction === 'asc';

      // Handle different field types for sorting
      switch (field.type) {
        case 'text':
          // Check if this is the title field by comparing field name
          if (field.name === 'Title' || field.name === 'title') {
            query = query.order('properties->>title', { ascending });
          } else {
            query = query.order(`properties->>${rule.fieldId}`, { ascending });
          }
          break;
        case 'date':
          query = query.order(`properties->>${rule.fieldId}`, { ascending });
          break;
        case 'number':
          query = query.order(`(properties->>${rule.fieldId})::numeric`, { ascending });
          break;
        case 'select':
        case 'status':
        default:
          query = query.order(`properties->>${rule.fieldId}`, { ascending });
          break;
      }
    });

    return query;
  }

  /**
   * Get total count for a database (optimized query)
   */
  static async getDatabasePageCount(
    databaseId: string,
    filterGroup: FilterGroup,
    fields: DatabaseField[],
    userId?: string
  ): Promise<{ count: number | null; error: string | null }> {
    try {
      let query = supabase
        .from('blocks')
        .select('*', { count: 'exact', head: true })
        .eq('properties->>database_id', databaseId)
        .eq('type', 'page')
        .is('in_trash', false);

      query = this.applyFilters(query, filterGroup, fields, userId);

      const { count, error } = await query;

      if (error) throw error;

      return { count: count || 0, error: null };
    } catch (err) {
      return {
        count: null,
        error: err instanceof Error ? err.message : 'Failed to get page count',
      };
    }
  }
}
