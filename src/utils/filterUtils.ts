import { FilterGroup, FilterRule, FilterOperator } from '@/types/filters';
import { DatabaseField } from '@/types/database';
import { format, isToday, isThisWeek, isThisMonth, isBefore, isAfter, parseISO, isValid } from 'date-fns';
import { resolveFilterGroupMeFilters } from './relativeFilters';

export function createEmptyFilterGroup(): FilterGroup {
  return {
    id: crypto.randomUUID(),
    operator: 'AND',
    rules: [],
    groups: []
  };
}

export function createEmptyFilterRule(fieldId?: string): FilterRule {
  return {
    id: crypto.randomUUID(),
    fieldId: fieldId || '',
    operator: 'equals',
    value: ''
  };
}

export function evaluateFilterRule(rule: FilterRule, value: any, field?: DatabaseField): boolean {
  const fieldValue = String(value || '').toLowerCase();
  const filterValue = String(rule.value || '').toLowerCase();
  const filterValue2 = String(rule.value2 || '').toLowerCase();

  switch (rule.operator) {
    case 'equals':
      return fieldValue === filterValue;
    
    case 'not_equals':
      return fieldValue !== filterValue;
    
    case 'contains':
      return fieldValue.includes(filterValue);
    
    case 'not_contains':
      return !fieldValue.includes(filterValue);
    
    case 'starts_with':
      return fieldValue.startsWith(filterValue);
    
    case 'ends_with':
      return fieldValue.endsWith(filterValue);
    
    case 'is_empty':
      return !value || String(value).trim() === '';
    
    case 'is_not_empty':
      return value && String(value).trim() !== '';
    
    case 'is_greater_than':
      if (field?.type === 'number') {
        const numValue = parseFloat(String(value));
        const numFilter = parseFloat(rule.value);
        return !isNaN(numValue) && !isNaN(numFilter) && numValue > numFilter;
      }
      if (field?.type === 'date') {
        const dateValue = parseISO(String(value));
        const dateFilter = parseISO(rule.value);
        return isValid(dateValue) && isValid(dateFilter) && isAfter(dateValue, dateFilter);
      }
      return false;
    
    case 'is_less_than':
      if (field?.type === 'number') {
        const numValue = parseFloat(String(value));
        const numFilter = parseFloat(rule.value);
        return !isNaN(numValue) && !isNaN(numFilter) && numValue < numFilter;
      }
      if (field?.type === 'date') {
        const dateValue = parseISO(String(value));
        const dateFilter = parseISO(rule.value);
        return isValid(dateValue) && isValid(dateFilter) && isBefore(dateValue, dateFilter);
      }
      return false;
    
    case 'is_between':
      if (field?.type === 'number') {
        const numValue = parseFloat(String(value));
        const numFilter1 = parseFloat(rule.value);
        const numFilter2 = parseFloat(rule.value2 || '');
        return !isNaN(numValue) && !isNaN(numFilter1) && !isNaN(numFilter2) && 
               numValue >= Math.min(numFilter1, numFilter2) && 
               numValue <= Math.max(numFilter1, numFilter2);
      }
      if (field?.type === 'date') {
        const dateValue = parseISO(String(value));
        const dateFilter1 = parseISO(rule.value);
        const dateFilter2 = parseISO(rule.value2 || '');
        return isValid(dateValue) && isValid(dateFilter1) && isValid(dateFilter2) &&
               !isBefore(dateValue, dateFilter1) && !isAfter(dateValue, dateFilter2);
      }
      return false;
    
    case 'is_today':
      const todayDate = parseISO(String(value));
      return isValid(todayDate) && isToday(todayDate);
    
    case 'is_this_week':
      const weekDate = parseISO(String(value));
      return isValid(weekDate) && isThisWeek(weekDate);
    
    case 'is_this_month':
      const monthDate = parseISO(String(value));
      return isValid(monthDate) && isThisMonth(monthDate);
    
    case 'is_past_due':
      const pastDate = parseISO(String(value));
      return isValid(pastDate) && isBefore(pastDate, new Date());
    
    case 'is_future':
      const futureDate = parseISO(String(value));
      return isValid(futureDate) && isAfter(futureDate, new Date());
    
    default:
      return true;
  }
}

export function evaluateFilterGroup(group: FilterGroup, data: any, fields: DatabaseField[], currentUserId?: string): boolean {
  // Resolve "me" filters before evaluation
  const resolvedGroup = currentUserId ? resolveFilterGroupMeFilters(group, currentUserId) : group;
  
  const ruleResults = resolvedGroup.rules.map(rule => {
    const field = fields.find(f => f.id === rule.fieldId);
    const value = data.properties?.[rule.fieldId] || data[rule.fieldId] || '';
    return evaluateFilterRule(rule, value, field);
  });

  const groupResults = resolvedGroup.groups.map(subGroup => 
    evaluateFilterGroup(subGroup, data, fields, currentUserId)
  );

  const allResults = [...ruleResults, ...groupResults];

  if (allResults.length === 0) return true;

  return resolvedGroup.operator === 'AND' 
    ? allResults.every(result => result)
    : allResults.some(result => result);
}

export function applyComplexFilters(data: any[], filterGroup: FilterGroup, fields: DatabaseField[], currentUserId?: string): any[] {
  if (!filterGroup || (filterGroup.rules.length === 0 && filterGroup.groups.length === 0)) {
    return data;
  }

  return data.filter(item => evaluateFilterGroup(filterGroup, item, fields, currentUserId));
}

export function getOperatorsForFieldType(fieldType: string): FilterOperator[] {
  return [
    'equals', 'not_equals', 'is_empty', 'is_not_empty',
    ...(fieldType === 'text' ? ['contains', 'not_contains', 'starts_with', 'ends_with'] : []),
    ...(fieldType === 'number' ? ['is_greater_than', 'is_less_than', 'is_between'] : []),
    ...(fieldType === 'date' ? [
      'is_greater_than', 'is_less_than', 'is_between',
      'is_today', 'is_this_week', 'is_this_month', 'is_past_due', 'is_future'
    ] : [])
  ] as FilterOperator[];
}

export function needsValue(operator: FilterOperator): boolean {
  return !['is_empty', 'is_not_empty', 'is_today', 'is_this_week', 'is_this_month', 'is_past_due', 'is_future'].includes(operator);
}

export function needsSecondValue(operator: FilterOperator): boolean {
  return operator === 'is_between';
}
