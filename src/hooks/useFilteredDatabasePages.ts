
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

  // STABILIZED: Create stable references using refs instead of JSON.stringify
  const stableFilterGroupRef = useRef(filterGroup);
  const stableFieldsRef = useRef(fields);
  const stableSortRulesRef = useRef(sortRules);
  
  // Only update refs when actual content changes
  const filterGroupKey = JSON.stringify(filterGroup);
  const fieldsKey = JSON.stringify(fields);
  const sortRulesKey = JSON.stringify(sortRules);
  
  const lastFilterGroupKeyRef = useRef('');
  const lastFieldsKeyRef = useRef('');
  const lastSortRulesKeyRef = useRef('');

  // Update refs only when keys actually change
  if (lastFilterGroupKeyRef.current !== filterGroupKey) {
    stableFilterGroupRef.current = filterGroup;
    lastFilterGroupKeyRef.current = filterGroupKey;
  }
  if (lastFieldsKeyRef.current !== fieldsKey) {
    stableFieldsRef.current = fields;
    lastFieldsKeyRef.current = fieldsKey;
  }
  if (lastSortRulesKeyRef.current !== sortRulesKey) {
    stableSortRulesRef.current = sortRules;
    lastSortRulesKeyRef.current = sortRulesKey;
  }

  // Create a stable query function
  const queryFunction = useCallback(() => {
    console.log('useFilteredDatabasePages: Query function called', { 
      databaseId,
      filterRules: stableFilterGroupRef.current.rules.length,
      fieldsCount: stableFieldsRef.current.length,
      sortRulesCount: stableSortRulesRef.current.length
    });
    return DatabaseQueryService.fetchDatabasePages(
      databaseId, 
      stableFilterGroupRef.current, 
      stableFieldsRef.current, 
      stableSortRulesRef.current
    );
  }, [databaseId]); // Only depend on databaseId, use refs for other values

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
        filterGroup: stableFilterGroupRef.current, 
        sortCount: stableSortRulesRef.current.length 
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
  }, [databaseId, executeWithRetry]);

  // Effect with stable dependencies - only trigger when keys change
  useEffect(() => {
    console.log('useFilteredDatabasePages: Effect triggered, calling fetchPages');
    fetchPages();
  }, [databaseId, filterGroupKey, fieldsKey, sortRulesKey, fetchPages]);

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
