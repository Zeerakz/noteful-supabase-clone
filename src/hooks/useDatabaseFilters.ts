
import { useState } from 'react';
import { FilterGroup } from '@/types/filters';

export function useDatabaseFilters() {
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    id: 'root',
    operator: 'and',
    rules: []
  });

  const updateFilterGroup = (newFilterGroup: FilterGroup) => {
    setFilterGroup(newFilterGroup);
  };

  return {
    filterGroup,
    updateFilterGroup
  };
}
