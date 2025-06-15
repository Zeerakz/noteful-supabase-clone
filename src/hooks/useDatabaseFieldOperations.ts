import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DatabaseField, FieldType } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export function useDatabaseFieldOperations(databaseId?: string, onFieldsChange?: () => void) {
  const { user } = useAuth();

  const handleSuccess = () => {
    onFieldsChange?.();
  };

  const createField = useCallback(async (field: { name: string; type: FieldType; settings?: any; }) => {
    if (!databaseId || !user) return;
    const { error } = await supabase.from('database_properties').insert([{
      database_id: databaseId,
      name: field.name,
      type: field.type as any,
      settings: field.settings || {},
      created_by: user.id,
    }]);
    if (!error) handleSuccess();
  }, [databaseId, handleSuccess, user]);

  const updateField = useCallback(async (fieldId: string, updates: Partial<DatabaseField>) => {
    if (!databaseId) return;
    const { error } = await supabase.from('database_properties').update(updates as any).eq('id', fieldId);
    if (!error) handleSuccess();
  }, [databaseId, handleSuccess]);

  const deleteField = useCallback(async (fieldId: string) => {
    if (!databaseId) return;
    const { error } = await supabase.from('database_properties').delete().eq('id', fieldId);
    if (!error) handleSuccess();
  }, [databaseId, handleSuccess]);

  const duplicateField = useCallback(async (field: DatabaseField) => {
    if (!databaseId || !user) return;

    const originalField = field;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, ...fieldToCopy } = originalField;

    const { data: maxPosData } = await supabase
      .from('database_properties')
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
      created_by: user.id,
    };

    const { error: insertError } = await supabase.from('database_properties').insert([newField as any]);

    if (insertError) {
      console.error('Failed to duplicate field:', insertError.message);
    } else {
      handleSuccess();
    }
  }, [databaseId, user, handleSuccess]);

  const reorderFields = useCallback(async (fields: DatabaseField[]) => {
    if (!databaseId) return;
    const updates = fields.map((field, index) => 
        supabase.from('database_properties').update({ pos: index }).eq('id', field.id)
    );
    
    const results = await Promise.all(updates);
    const firstError = results.find(result => result.error);

    if (!firstError) {
        handleSuccess();
    } else {
        console.error('Failed to reorder fields:', firstError.error.message);
    }
  }, [databaseId, handleSuccess]);

  return {
    createField,
    updateField,
    deleteField,
    duplicateField,
    reorderFields,
  };
}
