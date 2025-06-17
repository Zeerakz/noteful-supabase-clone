
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EnhancedDatabaseQueryService } from '@/services/database/enhancedDatabaseQueryService';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';

interface UseEnhancedDatabaseQueryProps {
  databaseId: string;
  fieldsToUse: DatabaseField[];
  filterGroup: FilterGroup;
  sortRules: SortRule[];
  userId?: string;
  pagination?: {
    enabled: boolean;
    currentPage: number;
    itemsPerPage: number;
  };
}

export function useEnhancedDatabaseQuery({
  databaseId,
  fieldsToUse,
  filterGroup,
  sortRules,
  userId,
  pagination = { enabled: false, currentPage: 1, itemsPerPage: 50 }
}: UseEnhancedDatabaseQueryProps) {
  // Query key for caching
  const queryKey = useMemo(() => [
    'enhanced-database-pages',
    databaseId,
    JSON.stringify(filterGroup),
    JSON.stringify(sortRules),
    pagination.enabled ? pagination.currentPage : 'all',
    pagination.enabled ? pagination.itemsPerPage : 'all',
    userId || 'no-user'
  ], [databaseId, filterGroup, sortRules, pagination.currentPage, pagination.itemsPerPage, pagination.enabled, userId]);

  // Enhanced query with server-side pagination
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const options = pagination.enabled ? {
        pagination: {
          page: pagination.currentPage,
          limit: pagination.itemsPerPage
        },
        enableCounting: true
      } : { enableCounting: false };

      return EnhancedDatabaseQueryService.fetchDatabasePages(
        databaseId,
        filterGroup,
        fieldsToUse,
        sortRules,
        userId,
        options
      );
    },
    enabled: !!databaseId && !!userId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    queryResult: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    queryKey,
  };
}
