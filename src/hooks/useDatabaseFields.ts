
import { useState, useEffect } from 'react';
import { DatabaseField } from '@/types/database';
import { PropertyType } from '@/types/property';
import { DatabaseFieldService } from '@/services/database/databaseFieldService';
import { useDatabaseFieldOperations } from '@/hooks/useDatabaseFieldOperations';
import { useRetryableQuery } from './useRetryableQuery';

export function useDatabaseFields(databaseId: string, workspaceId: string) {
  const [fields, setFields] = useState<DatabaseField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { executeWithRetry } = useRetryableQuery(
    () => DatabaseFieldService.fetchDatabaseFields(databaseId),
    { maxRetries: 3, baseDelay: 1000 }
  );

  const fetchFields = async () => {
    if (!databaseId) {
      setLoading(false);
      return;
    }

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

  // Get field operations
  const fieldOperations = useDatabaseFieldOperations(databaseId, fetchFields);

  useEffect(() => {
    fetchFields();
  }, [databaseId, executeWithRetry]);

  return {
    fields,
    loading,
    error,
    createField: fieldOperations.createField,
    updateField: fieldOperations.updateField,
    deleteField: fieldOperations.deleteField,
    duplicateField: fieldOperations.duplicateField,
    reorderFields: fieldOperations.reorderFields,
    refetch: fetchFields,
  };
}
