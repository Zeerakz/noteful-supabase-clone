
import { DatabaseField } from '@/types/database';
import { SortRule } from '@/components/database/SortingModal';

export class DatabaseQuerySorting {
  /**
   * Apply sorting to the query
   */
  static applySorting(
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
}
