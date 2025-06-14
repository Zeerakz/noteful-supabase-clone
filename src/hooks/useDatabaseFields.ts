
import { useState, useEffect, useCallback } from 'react';
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

  const fetchFields = useCallback(async () => {
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
  }, [databaseId, executeWithRetry]);

  // Get field operations
  const fieldOperations = useDatabaseFieldOperations(databaseId, fetchFields);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  // Temporarily added to create a test relation field for demonstration
  useEffect(() => {
    const createTestRelationField = async () => {
      // Check if a field with this name already exists to avoid duplicates
      const fieldExists = fields.some(f => f.name === 'Test Relation');
      
      if (!fieldExists) {
        console.log(`Attempting to create 'Test Relation' field in database ${databaseId}...`);
        try {
          await fieldOperations.createField({
            name: 'Test Relation',
            type: 'relation',
            settings: {
              targetDatabaseId: databaseId, // Self-referencing relation
              allowMultiple: true,
              bidirectional: false,
              displayProperty: 'title',
            },
          });
          console.log('Successfully triggered creation of Test Relation field.');
        } catch (e) {
            console.error("Failed to create test relation field:", e);
        }
      }
    };

    // Run this only after the initial field fetch is complete
    if (!loading && !error && databaseId) {
      createTestRelationField();
    }
  }, [loading, error, fields, databaseId, fieldOperations]);

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
