
import { useState, useMemo } from 'react';
import { FilterGroup } from '@/types/filters';
import { createEmptyFilterGroup, applyComplexFilters } from '@/utils/filterUtils';
import { DatabaseField } from '@/types/database';

export function useComplexFilters() {
  const [filterGroup, setFilterGroup] = useState<FilterGroup>(createEmptyFilterGroup());

  const hasActiveFilters = useMemo(() => {
    return countFilters(filterGroup) > 0;
  }, [filterGroup]);

  const applyFilters = (data: any[], fields: DatabaseField[]) => {
    return applyComplexFilters(data, filterGroup, fields);
  };

  const clearFilters = () => {
    setFilterGroup(createEmptyFilterGroup());
  };

  return {
    filterGroup,
    setFilterGroup,
    hasActiveFilters,
    applyFilters,
    clearFilters,
  };
}

function countFilters(group: FilterGroup): number {
  return group.rules.length + group.groups.reduce((count, subGroup) => count + countFilters(subGroup), 0);
}
