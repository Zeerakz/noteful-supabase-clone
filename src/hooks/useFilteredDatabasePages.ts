
import { useState, useEffect } from 'react';
import { DatabaseService } from '@/services/databaseService';
import { DatabaseField } from '@/types/database';
import { FilterRule } from '@/components/database/FilterModal';
import { SortRule } from '@/components/database/SortingModal';

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
        
        const { data, error: fetchError } = await DatabaseService.fetchDatabasePages(
          databaseId,
          filters,
          fields,
          sortRules
        );

        if (fetchError) {
          setError(fetchError);
          setPages([]);
        } else {
          setPages(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pages');
        setPages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [databaseId, filters, fields, sortRules]);

  return {
    pages,
    loading,
    error,
    refetch: () => {
      const fetchPages = async () => {
        try {
          setLoading(true);
          const { data, error: fetchError } = await DatabaseService.fetchDatabasePages(
            databaseId,
            filters,
            fields,
            sortRules
          );

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
      };
      fetchPages();
    }
  };
}
