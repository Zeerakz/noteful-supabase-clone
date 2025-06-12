
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

  const { pages, loading, error, refetch } = useFilteredDatabasePagesQuery({
    databaseId,
    filterGroup,
    fields,
    sortRules,
    enabled: !!databaseId
  });

  console.log('useFilteredDatabasePages: Query result', { 
    pagesCount: pages.length, 
    loading, 
    error 
  });

  return {
    pages,
    loading,
    error,
    refetch
  };
}
