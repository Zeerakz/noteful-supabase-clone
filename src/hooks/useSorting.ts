
import { useState } from 'react';
import { SortRule } from '@/components/database/SortingModal';

export function useSorting() {
  const [sortRules, setSortRules] = useState<SortRule[]>([]);

  const hasActiveSorts = sortRules.length > 0;

  const clearSorts = () => {
    setSortRules([]);
  };

  return {
    sortRules,
    setSortRules,
    hasActiveSorts,
    clearSorts,
  };
}
