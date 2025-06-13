
import { useState, useEffect } from 'react';
import { Database } from '@/types/database';
import { DatabaseService } from '@/services/databaseService';

export function useDatabase(databaseId?: string) {
  const [database, setDatabase] = useState<Database | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatabase = async () => {
      if (!databaseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await DatabaseService.getDatabase(databaseId);
        
        if (fetchError) {
          setError(fetchError);
        } else {
          setDatabase(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch database');
      } finally {
        setLoading(false);
      }
    };

    fetchDatabase();
  }, [databaseId]);

  return {
    database,
    loading,
    error
  };
}
