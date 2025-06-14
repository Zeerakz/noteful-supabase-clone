
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DatabaseQueryService } from '@/services/database/databaseQueryService';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();

  // Simplify query key - only include essential data for caching
  const queryKey = useMemo(() => [
    'database-pages',
    databaseId,
    // Only include filter/sort data if they exist
    filterGroup.rules.length > 0 ? JSON.stringify(filterGroup) : 'no-filters',
    sortRules.length > 0 ? JSON.stringify(sortRules) : 'no-sort',
    user?.id || 'no-user' // Include user context for "me" filters
  ], [databaseId, filterGroup, sortRules, user?.id]);

  console.log('useFilteredDatabasePagesQuery: Using query key', queryKey);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('useFilteredDatabasePagesQuery: Executing query function');
      const result = await DatabaseQueryService.fetchDatabasePages(
        databaseId,
        filterGroup,
        fields,
        sortRules,
        user?.id
      );
      console.log('useFilteredDatabasePagesQuery: Query result', { 
        dataLength: result.data?.length || 0, 
        error: result.error 
      });
      return result;
    },
    enabled: enabled && !!databaseId,
    staleTime: 0, // Always consider data stale to allow for real-time updates
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const refetch = useCallback(async () => {
    console.log('useFilteredDatabasePagesQuery: Manual refetch requested');
    // Invalidate and refetch this specific query
    await queryClient.invalidateQueries({ 
      queryKey: ['database-pages', databaseId] 
    });
    return query.refetch();
  }, [queryClient, databaseId, query.refetch]);

  return {
    pages: query.data?.data || [],
    loading: query.isPending,
    error: query.error ? (query.error as Error).message : (query.data?.error || null),
    refetch,
    queryKey,
  };
}
