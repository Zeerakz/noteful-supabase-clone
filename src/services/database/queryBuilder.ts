
import { supabase } from '@/integrations/supabase/client';
import { DatabaseQueryParams } from './types';

export class DatabaseQueryBuilder {
  static buildQuery(params: DatabaseQueryParams) {
    const { databaseId, filterGroup, sortRules, userId, options } = params;

    let query = supabase
      .from('blocks')
      .select('*', { count: options?.enableCounting ? 'exact' : undefined })
      .eq('properties->>database_id', databaseId)
      .eq('type', 'page')
      .eq('archived', false)
      .eq('in_trash', false);

    // Apply pagination if enabled
    if (options?.pagination) {
      const { page, limit } = options.pagination;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    }

    // Apply sorting
    if (sortRules && sortRules.length > 0) {
      sortRules.forEach((rule: any) => {
        const column = rule.fieldId === 'title' ? 'properties->>title' : `properties->>prop_${rule.fieldId}`;
        query = query.order(column, { ascending: rule.direction === 'asc' });
      });
    } else {
      // Default sort by creation time
      query = query.order('created_time', { ascending: false });
    }

    return query;
  }

  static buildCountQuery(params: DatabaseQueryParams) {
    const { databaseId } = params;

    return supabase
      .from('blocks')
      .select('*', { count: 'exact', head: true })
      .eq('properties->>database_id', databaseId)
      .eq('type', 'page')
      .eq('archived', false)
      .eq('in_trash', false);
  }
}
