
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  fieldType?: string;
  placeholder?: string;
}

export function EditableCell({ value, onSave, fieldType, placeholder = "Enter value..." }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="border-0 bg-transparent p-0 focus-visible:ring-1"
        placeholder={placeholder}
        autoFocus
      />
    );
  }

  return (
    <div
      className="min-h-[20px] cursor-text hover:bg-muted/50 p-1 rounded"
      onClick={() => setIsEditing(true)}
    >
      {value || (
        <span className="text-muted-foreground italic">{placeholder}</span>
      )}
    </div>
  );
}
