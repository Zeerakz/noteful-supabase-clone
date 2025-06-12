
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DatabaseQueryService } from '@/services/database/databaseQueryService';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { useCallback, useMemo } from 'react';

interface UseFilteredDatabasePagesQueryProps {
  databaseId: string;
  filterGroup: FilterGroup;
  fields: DatabaseField[];
  sortRules: SortRule[];
  enabled?: boolean;
}

export function useFilteredDatabasePagesQuery({ 
  databaseId, 
  filterGroup, 
  fields, 
  sortRules,
  enabled = true
}: UseFilteredDatabasePagesQueryProps) {
  const queryClient = useQueryClient();

  // Create stable query key
  const queryKey = useMemo(() => [
    'database-pages',
    databaseId,
    JSON.stringify(filterGroup),
    JSON.stringify(fields.map(f => ({ id: f.id, type: f.type }))),
    JSON.stringify(sortRules)
  ], [databaseId, filterGroup, fields, sortRules]);

  const query = useQuery({
    queryKey,
    queryFn: () => DatabaseQueryService.fetchDatabasePages(
      databaseId,
      filterGroup,
      fields,
      sortRules
    ),
    enabled: enabled && !!databaseId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const refetch = useCallback(async () => {
    console.log('useFilteredDatabasePagesQuery: Manual refetch requested');
    await queryClient.invalidateQueries({ 
      queryKey: ['database-pages', databaseId] 
    });
    return query.refetch();
  }, [queryClient, databaseId, query.refetch]);

  return {
    pages: query.data?.data || [],
    loading: query.isPending,
    error: query.error ? (query.error as Error).message : (query.data?.error || null),
    refetch
  };
}
