
import { useState, useEffect } from 'react';
import { DatabaseField } from '@/types/database';
import { useDatabaseFields } from '@/hooks/useDatabaseFields';

export function useOptimisticDatabaseFields(databaseId: string) {
  const { fields: serverFields, loading, error } = useDatabaseFields(databaseId);
  const [optimisticFields, setOptimisticFields] = useState<DatabaseField[]>([]);

  // Sync optimistic fields with server fields
  useEffect(() => {
    setOptimisticFields(serverFields);
  }, [serverFields]);

  const optimisticCreateField = (field: Partial<DatabaseField>) => {
    const tempId = `temp-${Date.now()}`;
    const newField: DatabaseField = {
      id: tempId,
      name: field.name || 'Untitled',
      type: field.type || 'text',
      database_id: databaseId,
      settings: field.settings || {},
      pos: optimisticFields.length,
      created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...field,
    };

    setOptimisticFields(prev => [...prev, newField]);
    return tempId;
  };

  const optimisticUpdateField = (fieldId: string, updates: Partial<DatabaseField>) => {
    setOptimisticFields(prev => 
      prev.map(field => 
        field.id === fieldId 
          ? { ...field, ...updates, updated_at: new Date().toISOString() }
          : field
      )
    );
  };

  const optimisticDeleteField = (fieldId: string) => {
    setOptimisticFields(prev => prev.filter(field => field.id !== fieldId));
  };

  const optimisticReorderFields = (reorderedFields: DatabaseField[]) => {
    setOptimisticFields(reorderedFields);
  };

  const revertOptimisticChanges = () => {
    setOptimisticFields(serverFields);
  };

  return {
    fields: optimisticFields,
    loading,
    error,
    optimisticCreateField,
    optimisticUpdateField,
    optimisticDeleteField,
    optimisticReorderFields,
    revertOptimisticChanges,
  };
}
