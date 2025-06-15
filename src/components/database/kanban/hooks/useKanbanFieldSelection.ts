
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

  // Auto-select the first available field when fields change, prioritizing status fields
  useEffect(() => {
    const isCurrentFieldValid = selectedField && selectFields.some(f => f.id === selectedField.id);

    if (!isCurrentFieldValid && selectFields.length > 0) {
      // Prioritize status field as default
      const statusField = selectFields.find(f => f.type === 'status');
      const defaultField = statusField || selectFields[0];
      console.log('useKanbanFieldSelection: Auto-selecting default field:', defaultField);
      setSelectedField(defaultField);
    } else if (selectFields.length === 0) {
      setSelectedField(null);
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
