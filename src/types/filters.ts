
export type FilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'is_greater_than'
  | 'is_less_than'
  | 'is_between'
  | 'is_today'
  | 'is_this_week'
  | 'is_this_month'
  | 'is_past_due'
  | 'is_future';

export type FilterGroupOperator = 'AND' | 'OR';

export interface FilterRule {
  id: string;
  fieldId: string;
  operator: FilterOperator;
  value: string;
  value2?: string; // For 'is_between' operator
}

export interface FilterGroup {
  id: string;
  operator: FilterGroupOperator;
  rules: FilterRule[];
  groups: FilterGroup[];
}

export interface ComplexFilter {
  id: string;
  rootGroup: FilterGroup;
}

export const FILTER_OPERATORS = [
  { value: 'equals', label: 'equals', types: ['text', 'number', 'select', 'date'] },
  { value: 'not_equals', label: 'does not equal', types: ['text', 'number', 'select', 'date'] },
  { value: 'contains', label: 'contains', types: ['text'] },
  { value: 'not_contains', label: 'does not contain', types: ['text'] },
  { value: 'starts_with', label: 'starts with', types: ['text'] },
  { value: 'ends_with', label: 'ends with', types: ['text'] },
  { value: 'is_empty', label: 'is empty', types: ['text', 'number', 'select', 'date'] },
  { value: 'is_not_empty', label: 'is not empty', types: ['text', 'number', 'select', 'date'] },
  { value: 'is_greater_than', label: 'is greater than', types: ['number', 'date'] },
  { value: 'is_less_than', label: 'is less than', types: ['number', 'date'] },
  { value: 'is_between', label: 'is between', types: ['number', 'date'] },
  { value: 'is_today', label: 'is today', types: ['date'] },
  { value: 'is_this_week', label: 'is this week', types: ['date'] },
  { value: 'is_this_month', label: 'is this month', types: ['date'] },
  { value: 'is_past_due', label: 'is past due', types: ['date'] },
  { value: 'is_future', label: 'is in the future', types: ['date'] },
] as const;

export const DATE_OPERATORS = [
  'is_today',
  'is_this_week', 
  'is_this_month',
  'is_past_due',
  'is_future'
] as const;

export const VALUE_OPERATORS = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'is_greater_than',
  'is_less_than'
] as const;

export const RANGE_OPERATORS = ['is_between'] as const;

export const EMPTY_OPERATORS = ['is_empty', 'is_not_empty'] as const;
