
import { useState } from 'react';

export interface SortRule {
  fieldId: string;
  direction: 'asc' | 'desc';
}

export function useDatabaseSorting() {
  const [sortRules, setSortRules] = useState<SortRule[]>([]);

  return {
    sortRules,
    setSortRules
  };
}
