
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';

export class DatabaseQueryFilters {
  /**
   * Apply filters to the query
   */
  static applyFilters(
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
}
