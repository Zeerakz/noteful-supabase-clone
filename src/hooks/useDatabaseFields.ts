
import { useState, useEffect } from 'react';
import { DatabaseField } from '@/types/database';
import { DatabaseService } from '@/services/databaseService';

export function useDatabaseFields(databaseId: string) {
  const [fields, setFields] = useState<DatabaseField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!databaseId) {
      setLoading(false);
      return;
    }

    const fetchFields = async () => {
      try {
        setLoading(true);
        const { data, error } = await DatabaseService.fetchDatabaseFields(databaseId);
        
        if (error) {
          setError(error);
        } else {
          setFields(data || []);
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch fields');
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [databaseId]);

  return {
    fields,
    loading,
    error,
  };
}
