
import { FilterRule } from '@/types/filters';
import { DatabaseField } from '@/types/database';

export const ME_FILTER_VALUE = '__ME__';

export function createMeFilter(fieldId: string): FilterRule {
  return {
    id: crypto.randomUUID(),
    fieldId,
    operator: 'equals',
    value: ME_FILTER_VALUE
  };
}

export function isMeFilter(rule: FilterRule): boolean {
  return rule.value === ME_FILTER_VALUE;
}

export function resolveMeFilter(rule: FilterRule, currentUserId?: string): FilterRule {
  if (isMeFilter(rule) && currentUserId) {
    return {
      ...rule,
      value: currentUserId
    };
  }
  return rule;
}

export function resolveFilterGroupMeFilters(
  filterGroup: any, 
  currentUserId?: string
): any {
  return {
    ...filterGroup,
    rules: filterGroup.rules.map((rule: FilterRule) => resolveMeFilter(rule, currentUserId)),
    groups: filterGroup.groups.map((group: any) => resolveFilterGroupMeFilters(group, currentUserId))
  };
}

export function getPersonFieldOptions(fields: DatabaseField[]): Array<{ id: string; name: string }> {
  return fields
    .filter(field => field.type === 'person' || field.type === 'people')
    .map(field => ({ id: field.id, name: field.name }));
}
