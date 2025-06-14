
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DatabaseField } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export function useDatabaseFieldOperations(databaseId?: string, onFieldsChange?: () => void) {
  const { user } = useAuth();

  const handleSuccess = () => {
    onFieldsChange?.();
  };

  const createField = useCallback(async (field: { name: string; type: any; settings?: any; }) => {
    if (!databaseId || !user) return;
    const { error } = await supabase.from('fields').insert({
      database_id: databaseId,
      name: field.name,
      type: field.type,
      settings: field.settings || {},
      created_by: user.id,
    });
    if (!error) handleSuccess();
  }, [databaseId, handleSuccess, user]);

  const updateField = useCallback(async (fieldId: string, updates: Partial<DatabaseField>) => {
    if (!databaseId) return;
    const { error } = await supabase.from('fields').update(updates).eq('id', fieldId);
    if (!error) handleSuccess();
  }, [databaseId, handleSuccess]);

  const deleteField = useCallback(async (fieldId: string) => {
    if (!databaseId) return;
    const { error } = await supabase.from('fields').delete().eq('id', fieldId);
    if (!error) handleSuccess();
  }, [databaseId, handleSuccess]);

  const duplicateField = useCallback(async (field: DatabaseField) => {
    if (!databaseId) return;

    const originalField = field;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, ...fieldToCopy } = originalField;

    const { data: maxPosData } = await supabase
      .from('fields')
      .select('pos')
      .eq('database_id', databaseId)
      .order('pos', { ascending: false })
      .limit(1)
      .single();

    const newPosition = (maxPosData?.pos ?? -1) + 1;

    const newField = {
      ...fieldToCopy,
      name: `${originalField.name} (Copy)`,
      pos: newPosition,
      created_by: originalField.created_by, // Assuming we want to keep the original creator
    };

    const { error: insertError } = await supabase.from('fields').insert(newField);

    if (insertError) {
      console.error('Failed to duplicate field:', insertError.message);
    } else {
      handleSuccess();
    }
  }, [databaseId, handleSuccess]);

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
