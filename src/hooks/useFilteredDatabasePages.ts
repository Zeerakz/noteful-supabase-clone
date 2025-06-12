
import { useState, useEffect, useCallback, useMemo } from 'react';
import { DatabaseQueryService } from '@/services/database/databaseQueryService';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { useRetryableQuery } from './useRetryableQuery';

interface UseFilteredDatabasePagesProps {
  databaseId: string;
  filterGroup: FilterGroup;
  fields: DatabaseField[];
  sortRules: SortRule[];
}

export function useFilteredDatabasePages({ databaseId, filterGroup, fields, sortRules }: UseFilteredDatabasePagesProps) {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stabilize all dependencies using useMemo to prevent infinite re-renders
  const stableFilterGroup = useMemo(() => filterGroup, [JSON.stringify(filterGroup)]);
  const stableFields = useMemo(() => fields, [JSON.stringify(fields)]);
  const stableSortRules = useMemo(() => sortRules, [JSON.stringify(sortRules)]);

  // Create a stable query function that doesn't change on every render
  const queryFunction = useCallback(() => {
    console.log('Query function called for database:', databaseId);
    return DatabaseQueryService.fetchDatabasePages(databaseId, stableFilterGroup, stableFields, stableSortRules);
  }, [databaseId, stableFilterGroup, stableFields, stableSortRules]);

  const { executeWithRetry, retryCount, isRetrying } = useRetryableQuery(
    queryFunction,
    { maxRetries: 3, baseDelay: 1000 }
  );

  // Memoize the fetch function to prevent unnecessary re-executions
  const fetchPages = useCallback(async () => {
    if (!databaseId) {
      setPages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching pages with filter group:', stableFilterGroup, 'sorts:', stableSortRules.length);
      const { data, error: fetchError } = await executeWithRetry();

      if (fetchError) {
        console.error('Pages fetch error:', fetchError);
        setError(fetchError);
        setPages([]);
      } else {
        console.log('Pages fetched successfully:', data?.length || 0);
        setPages(data || []);
      }
    } catch (err) {
      console.error('Pages fetch exception:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pages');
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, [databaseId, executeWithRetry, stableFilterGroup, stableSortRules]);

  // Use effect with stable dependencies
  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await executeWithRetry();

      if (fetchError) {
        setError(fetchError);
      } else {
        setPages(data || []);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  }, [executeWithRetry]);

  return {
    pages,
    loading: loading || isRetrying,
    error: error ? `${error}${retryCount > 0 ? ` (Retry ${retryCount}/3)` : ''}` : null,
    refetch
  };
}
