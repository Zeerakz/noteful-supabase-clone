
import { useState, useEffect } from 'react';
import { DatabaseField } from '@/types/database';

interface UseKanbanFieldSelectionProps {
  fields: DatabaseField[];
}

export function useKanbanFieldSelection({ fields }: UseKanbanFieldSelectionProps) {
  const [selectedField, setSelectedField] = useState<DatabaseField | null>(null);

  // Get all select-type and status fields for grouping options, filter out fields with empty IDs
  const selectFields = fields.filter(field => {
    const isValidType = ['select', 'multi_select', 'status'].includes(field.type);
    const hasValidId = field.id && field.id.trim() !== '';
    
    if (isValidType && !hasValidId) {
      console.warn('useKanbanFieldSelection: Filtering out field with empty ID:', field);
    }
    
    return isValidType && hasValidId;
  });

  console.log('useKanbanFieldSelection: Valid select fields:', selectFields);

  // Auto-select the first available field when fields change
  useEffect(() => {
    if (selectFields.length > 0 && !selectedField) {
      console.log('useKanbanFieldSelection: Auto-selecting first field:', selectFields[0]);
      setSelectedField(selectFields[0]);
    } else if (selectFields.length === 0) {
      console.log('useKanbanFieldSelection: No valid fields, clearing selection');
      setSelectedField(null);
    } else if (selectedField && !selectFields.some(f => f.id === selectedField.id)) {
      // If currently selected field is no longer available, select the first available one
      console.log('useKanbanFieldSelection: Current field no longer valid, selecting new one:', selectFields[0]);
      setSelectedField(selectFields[0] || null);
    }
  }, [selectFields, selectedField]);

  const handleFieldChange = (field: DatabaseField | null) => {
    console.log('useKanbanFieldSelection: Field change:', field);
    setSelectedField(field);
  };

  return {
    selectedField,
    selectFields,
    handleFieldChange,
  };
}
