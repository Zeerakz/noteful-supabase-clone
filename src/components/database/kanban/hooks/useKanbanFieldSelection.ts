
import { useState, useEffect } from 'react';
import { DatabaseField } from '@/types/database';

interface UseKanbanFieldSelectionProps {
  fields: DatabaseField[];
}

export function useKanbanFieldSelection({ fields }: UseKanbanFieldSelectionProps) {
  const [selectedField, setSelectedField] = useState<DatabaseField | null>(null);

  // Get all select-type and status fields for grouping options, filter out fields with empty IDs
  const selectFields = fields.filter(field => 
    (field.type === 'select' || field.type === 'multi-select' || field.type === 'status') &&
    field.id && field.id.trim() !== ''
  );

  // Auto-select the first available field when fields change
  useEffect(() => {
    if (selectFields.length > 0 && !selectedField) {
      setSelectedField(selectFields[0]);
    } else if (selectFields.length === 0) {
      setSelectedField(null);
    } else if (selectedField && !selectFields.some(f => f.id === selectedField.id)) {
      // If currently selected field is no longer available, select the first available one
      setSelectedField(selectFields[0] || null);
    }
  }, [selectFields, selectedField]);

  const handleFieldChange = (field: DatabaseField | null) => {
    setSelectedField(field);
  };

  return {
    selectedField,
    selectFields,
    handleFieldChange,
  };
}
