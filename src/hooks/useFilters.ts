
import { useState, useMemo } from 'react';
import { FilterRule } from '@/types/filters';

export function useFilters() {
  const [filters, setFilters] = useState<FilterRule[]>([]);

  const hasActiveFilters = useMemo(() => filters.length > 0, [filters]);

  const applyFilters = (data: any[], fields: any[]) => {
    if (filters.length === 0) return data;

    return data.filter(item => {
      return filters.every(filter => {
        const field = fields.find(f => f.id === filter.fieldId);
        if (!field) return true;

        const value = item.properties?.[filter.fieldId] || '';
        const filterValue = filter.value.toLowerCase();
        const itemValue = String(value).toLowerCase();

        switch (filter.operator) {
          case 'equals':
            return itemValue === filterValue;
          case 'not_equals':
            return itemValue !== filterValue;
          case 'contains':
            return itemValue.includes(filterValue);
          case 'not_contains':
            return !itemValue.includes(filterValue);
          case 'is_empty':
            return !value || value.trim() === '';
          case 'is_not_empty':
            return value && value.trim() !== '';
          default:
            return true;
        }
      });
    });
  };

  const clearFilters = () => {
    setFilters([]);
  };

  return {
    filters,
    setFilters,
    hasActiveFilters,
    applyFilters,
    clearFilters,
  };
}
