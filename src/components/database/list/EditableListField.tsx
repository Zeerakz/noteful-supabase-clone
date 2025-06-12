
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';

interface EditableListFieldProps {
  value: string;
  fieldType: string;
  onSave: (value: string) => void;
}

export function EditableListField({ value, fieldType, onSave }: EditableListFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
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
        className="text-sm"
        autoFocus
      />
    );
  }

  return (
    <div
      className="cursor-text hover:bg-muted/50 p-2 rounded min-h-[32px] text-sm border border-transparent hover:border-border transition-colors"
      onClick={() => setIsEditing(true)}
    >
      {value || (
        <span className="text-muted-foreground italic">Empty</span>
      )}
    </div>
  );
}
