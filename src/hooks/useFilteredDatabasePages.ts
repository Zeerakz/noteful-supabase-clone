
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

  // Use refs to store the actual objects and their serialized versions
  const prevFilterGroupRef = useRef<FilterGroup>();
  const prevFilterGroupStrRef = useRef<string>('');
  const prevFieldsRef = useRef<DatabaseField[]>();
  const prevFieldsStrRef = useRef<string>('');
  const prevSortRulesRef = useRef<SortRule[]>();
  const prevSortRulesStrRef = useRef<string>('');
  
  const currentFilterGroupStr = JSON.stringify(filterGroup);
  const currentFieldsStr = JSON.stringify(fields);
  const currentSortRulesStr = JSON.stringify(sortRules);
  
  // Only update when the serialized values actually change, but return the original objects
  const stableFilterGroup = useMemo(() => {
    console.log('useFilteredDatabasePages: Checking filterGroup stability', { 
      currentStr: currentFilterGroupStr, 
      prevStr: prevFilterGroupStrRef.current,
      changed: prevFilterGroupStrRef.current !== currentFilterGroupStr 
    });
    
    if (prevFilterGroupStrRef.current !== currentFilterGroupStr) {
      prevFilterGroupStrRef.current = currentFilterGroupStr;
      prevFilterGroupRef.current = filterGroup;
      return filterGroup;
    }
    return prevFilterGroupRef.current || filterGroup;
  }, [currentFilterGroupStr, filterGroup]);
  
  const stableFields = useMemo(() => {
    console.log('useFilteredDatabasePages: Checking fields stability', { 
      currentStr: currentFieldsStr, 
      prevStr: prevFieldsStrRef.current,
      changed: prevFieldsStrRef.current !== currentFieldsStr 
    });
    
    if (prevFieldsStrRef.current !== currentFieldsStr) {
      prevFieldsStrRef.current = currentFieldsStr;
      prevFieldsRef.current = fields;
      return fields;
    }
    return prevFieldsRef.current || fields;
  }, [currentFieldsStr, fields]);
  
  const stableSortRules = useMemo(() => {
    console.log('useFilteredDatabasePages: Checking sortRules stability', { 
      currentStr: currentSortRulesStr, 
      prevStr: prevSortRulesStrRef.current,
      changed: prevSortRulesStrRef.current !== currentSortRulesStr 
    });
    
    if (prevSortRulesStrRef.current !== currentSortRulesStr) {
      prevSortRulesStrRef.current = currentSortRulesStr;
      prevSortRulesRef.current = sortRules;
      return sortRules;
    }
    return prevSortRulesRef.current || sortRules;
  }, [currentSortRulesStr, sortRules]);

  // Create a stable query function that doesn't change on every render
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

  // Memoize the fetch function to prevent unnecessary re-executions
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

  // Use effect with stable dependencies
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
