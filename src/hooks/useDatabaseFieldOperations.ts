
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DatabaseField } from '@/types/database';

export function useDatabaseFieldOperations(databaseId?: string, onFieldsChange?: () => void) {
  const handleSuccess = () => {
    onFieldsChange?.();
  };

  const createField = useCallback(async (field: { name: string; type: any; settings?: any; }) => {
    if (!databaseId) return;
    const { error } = await supabase.from('fields').insert({
      database_id: databaseId,
      name: field.name,
      type: field.type,
      settings: field.settings || {},
    });
    if (!error) handleSuccess();
  }, [databaseId, handleSuccess]);

  const updateField = useCallback(async (fieldId: string, updates: Partial<DatabaseField>) => {
    if (!databaseId) return;
    const { error } = await supabase.from('fields').update(updates).eq('id', fieldId);
    if (!error) handleSuccess();
  }, [databaseId, handleSuccess]);

  const deleteField = useCallback(async (field: DatabaseField) => {
    if (!databaseId) return;
    const { error } = await supabase.from('fields').delete().eq('id', field.id);
    if (!error) handleSuccess();
  }, [databaseId, handleSuccess]);

  const duplicateField = useCallback(async (fieldId: string) => {
    console.log('duplicateField not implemented', fieldId);
  }, []);

  const reorderFields = useCallback(async (fields: DatabaseField[]) => {
    if (!databaseId) return;
    const updates = fields.map((field, index) => ({
      id: field.id,
      pos: index,
    }));
    const { error } = await supabase.from('fields').upsert(updates);
    if (!error) handleSuccess();
  }, [databaseId, handleSuccess]);

  return {
    createField,
    updateField,
    deleteField,
    duplicateField,
    reorderFields,
  };
}
