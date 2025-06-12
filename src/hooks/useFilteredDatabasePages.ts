
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

  // Create stable references using JSON comparison
  const stableFilterGroup = useMemo(() => filterGroup, [JSON.stringify(filterGroup)]);
  const stableFields = useMemo(() => fields, [JSON.stringify(fields)]);
  const stableSortRules = useMemo(() => sortRules, [JSON.stringify(sortRules)]);

  // Create a stable query function
  const queryFunction = useCallback(() => {
    console.log('useFilteredDatabasePages: Query function called', { 
      databaseId,
      filterRules: stableFilterGroup.rules.length,
      fieldsCount: stableFields.length,
      sortRulesCount: stableSortRules.length
    });
    return DatabaseQueryService.fetchDatabasePages(databaseId, stableFilterGroup, stableFields, stableSortRules);
  }, [databaseId, stableFilterGroup, stableFields, stableSortRules]);

  const { executeWithRetry, retryCount, isRetrying } = useRetryableQuery(
    queryFunction,
    { maxRetries: 3, baseDelay: 1000 }
  );

  // Fetch function with stable dependencies
  const fetchPages = useCallback(async () => {
    console.log('useFilteredDatabasePages: fetchPages called', { databaseId });
    
    if (!databaseId) {
      console.log('useFilteredDatabasePages: No databaseId, clearing pages');
      setPages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('useFilteredDatabasePages: Executing query', { 
        filterGroup: stableFilterGroup, 
        sortCount: stableSortRules.length 
      });
      const { data, error: fetchError } = await executeWithRetry();

      if (fetchError) {
        console.error('useFilteredDatabasePages: Pages fetch error:', fetchError);
        setError(fetchError);
        setPages([]);
      } else {
        console.log('useFilteredDatabasePages: Pages fetched successfully', { count: data?.length || 0 });
        setPages(data || []);
      }
    } catch (err) {
      console.error('useFilteredDatabasePages: Pages fetch exception:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pages');
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, [databaseId, executeWithRetry, stableFilterGroup, stableSortRules]);

  // Effect with stable dependencies
  useEffect(() => {
    console.log('useFilteredDatabasePages: Effect triggered, calling fetchPages');
    fetchPages();
  }, [fetchPages]);

  const refetch = useCallback(async () => {
    console.log('useFilteredDatabasePages: Manual refetch requested');
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
