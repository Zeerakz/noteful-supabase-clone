
import { useState, useEffect } from 'react';
import { DatabaseField } from '@/types/database';
import { DatabaseFieldService } from '@/services/database/databaseFieldService';
import { useRetryableQuery } from './useRetryableQuery';

export function useDatabaseFields(databaseId: string) {
  const [fields, setFields] = useState<DatabaseField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { executeWithRetry } = useRetryableQuery(
    () => DatabaseFieldService.fetchDatabaseFields(databaseId),
    { maxRetries: 3, baseDelay: 1000 }
  );

  useEffect(() => {
    if (!databaseId) {
      setLoading(false);
      return;
    }

    const fetchFields = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching fields for database:', databaseId);
        const { data, error: fetchError } = await executeWithRetry();
        
        if (fetchError) {
          console.error('Fields fetch error:', fetchError);
          setError(fetchError);
        } else {
          console.log('Fields fetched successfully:', data?.length || 0);
          setFields(data || []);
        }
      } catch (err) {
        console.error('Fields fetch exception:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch fields');
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [databaseId, executeWithRetry]);

  return {
    fields,
    loading,
    error,
  };
}
