
import { useMemo, useCallback } from 'react';
import { useOptimisticDatabaseFields } from '@/hooks/useOptimisticDatabaseFields';
import { useEnhancedDatabaseFieldOperations } from '@/hooks/useEnhancedDatabaseFieldOperations';
import { DatabaseField } from '@/types/database';

interface UseDatabaseFieldManagementProps {
  databaseId: string;
  propFields: DatabaseField[];
  onFieldsChange?: () => void;
}

export function useDatabaseFieldManagement({
  databaseId,
  propFields,
  onFieldsChange,
}: UseDatabaseFieldManagementProps) {
  const {
    fields: optimisticFields,
    optimisticCreateField,
    optimisticUpdateField,
    optimisticDeleteField,
    optimisticReorderFields,
    revertOptimisticChanges,
  } = useOptimisticDatabaseFields(databaseId);

  const fieldOperations = useEnhancedDatabaseFieldOperations({
    databaseId,
    onOptimisticCreate: optimisticCreateField,
    onOptimisticUpdate: optimisticUpdateField,
    onOptimisticDelete: optimisticDeleteField,
    onOptimisticReorder: optimisticReorderFields,
    onRevert: revertOptimisticChanges,
    onFieldsChange,
  });

  const fieldsToUse = useMemo(() => {
    const fields = optimisticFields.length > 0 ? optimisticFields : propFields;
    return fields.map(field => ({
      ...field,
      database_id: field.database_id || databaseId
    }));
  }, [optimisticFields, propFields, databaseId]);

  const handleFieldReorder = useCallback(async (draggedFieldId: string, targetFieldId: string, position: 'before' | 'after') => {
    const currentFields = [...fieldsToUse];
    const draggedIndex = currentFields.findIndex(f => f.id === draggedFieldId);
    const targetIndex = currentFields.findIndex(f => f.id === targetFieldId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedField] = currentFields.splice(draggedIndex, 1);
    
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    currentFields.splice(insertIndex, 0, draggedField);

    const reorderedFields = currentFields.map((field, index) => ({
      ...field,
      pos: index
    }));

    await fieldOperations.reorderFields(reorderedFields);
  }, [fieldsToUse, fieldOperations]);

  return {
    fieldsToUse,
    fieldOperations,
    handleFieldReorder,
  };
}
