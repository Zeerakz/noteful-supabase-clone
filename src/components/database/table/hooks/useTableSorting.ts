
import { useCallback } from 'react';
import { SortRule } from '@/components/database/SortingModal';

interface UseTableSortingProps {
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
}

export function useTableSorting({ sortRules, setSortRules }: UseTableSortingProps) {
  const handleSort = useCallback((fieldId: string, direction: 'asc' | 'desc') => {
    const existingRuleIndex = sortRules.findIndex(rule => rule.fieldId === fieldId);
    
    if (existingRuleIndex !== -1) {
      const currentRule = sortRules[existingRuleIndex];
      
      // If same direction, remove the sort rule
      if (currentRule.direction === direction) {
        const newRules = sortRules.filter((_, index) => index !== existingRuleIndex);
        setSortRules(newRules);
        return;
      }
      
      // Update direction
      const newRules = [...sortRules];
      newRules[existingRuleIndex] = { ...currentRule, direction };
      setSortRules(newRules);
    } else {
      // Add new sort rule
      const newRule: SortRule = {
        fieldId,
        direction
      };
      setSortRules([...sortRules, newRule]);
    }
  }, [sortRules, setSortRules]);

  const clearSort = useCallback((fieldId: string) => {
    const newRules = sortRules.filter(rule => rule.fieldId !== fieldId);
    setSortRules(newRules);
  }, [sortRules, setSortRules]);

  const clearAllSorts = useCallback(() => {
    setSortRules([]);
  }, [setSortRules]);

  return {
    handleSort,
    clearSort,
    clearAllSorts
  };
}
