
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Block } from '@/types/block';
import { useDebounce } from '@/hooks/useDebounce';

interface UseDatabaseSearchProps {
  databaseId: string;
  searchTerm: string;
  enabled?: boolean;
}

export function useDatabaseSearch({
  databaseId,
  searchTerm,
  enabled = true
}: UseDatabaseSearchProps) {
  const [pages, setPages] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const searchPages = useCallback(async (term: string) => {
    if (!enabled || !databaseId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('blocks')
        .select('*')
        .eq('type', 'page')
        .eq('properties->>database_id', databaseId)
        .order('created_time', { ascending: false })
        .limit(100); // Reasonable limit for search results

      // If there's a search term, filter by title
      if (term.trim()) {
        query = query.ilike('properties->>title', `%${term}%`);
      }

      const { data, error: searchError } = await query;

      if (searchError) {
        throw searchError;
      }

      setPages((data as Block[]) || []);
    } catch (err) {
      console.error('Error searching pages:', err);
      setError(err instanceof Error ? err.message : 'Failed to search pages');
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, [databaseId, enabled]);

  useEffect(() => {
    searchPages(debouncedSearchTerm);
  }, [debouncedSearchTerm, searchPages]);

  return {
    pages,
    loading,
    error,
    searchPages: useCallback((term: string) => searchPages(term), [searchPages])
  };
}
