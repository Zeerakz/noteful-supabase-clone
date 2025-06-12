
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { useFilteredDatabasePagesQuery } from './useFilteredDatabasePagesQuery';

interface UseFilteredDatabasePagesProps {
  databaseId: string;
  filterGroup: FilterGroup;
  fields: DatabaseField[];
  sortRules: SortRule[];
}

export function useFilteredDatabasePages({ 
  databaseId, 
  filterGroup, 
  fields, 
  sortRules 
}: UseFilteredDatabasePagesProps) {
  console.log('useFilteredDatabasePages: Hook called', { 
    databaseId,
    filterRules: filterGroup.rules.length,
    fieldsCount: fields.length,
    sortRulesCount: sortRules.length
  });

  // Direct passthrough to the query hook - no intermediate state
  return useFilteredDatabasePagesQuery({
    databaseId,
    filterGroup,
    fields,
    sortRules,
    enabled: !!databaseId
  });
}
