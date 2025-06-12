
import { useState, useEffect, useCallback } from 'react';
import { DatabaseQueryService } from '@/services/database/databaseQueryService';
import { DatabaseField } from '@/types/database';
import { FilterRule } from '@/components/database/FilterModal';
import { SortRule } from '@/components/database/SortingModal';
import { useRetryableQuery } from './useRetryableQuery';

interface UseFilteredDatabasePagesProps {
  databaseId: string;
  filters: FilterRule[];
  fields: DatabaseField[];
  sortRules: SortRule[];
}

export function useFilteredDatabasePages({ databaseId, filters, fields, sortRules }: UseFilteredDatabasePagesProps) {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a stable query function that doesn't change on every render
  const queryFunction = useCallback(() => {
    console.log('Query function called for database:', databaseId);
    return DatabaseQueryService.fetchDatabasePages(databaseId, filters, fields, sortRules);
  }, [databaseId, JSON.stringify(filters), JSON.stringify(sortRules)]);

  const { executeWithRetry, retryCount, isRetrying } = useRetryableQuery(
    queryFunction,
    { maxRetries: 3, baseDelay: 1000 }
  );

  useEffect(() => {
    const fetchPages = async () => {
      if (!databaseId) {
        setPages([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching pages with filters:', filters.length, 'sorts:', sortRules.length);
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
    };

    fetchPages();
  }, [databaseId, executeWithRetry]);

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
