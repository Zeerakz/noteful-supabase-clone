
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';

interface EditableListTitleProps {
  value: string;
  onSave: (value: string) => void;
}

export function EditableListTitle({ value, onSave }: EditableListTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    if (editValue.trim() !== value) {
      onSave(editValue.trim());
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
        className="font-semibold"
        autoFocus
      />
    );
  }

  return (
    <div
      className="cursor-text hover:bg-muted/50 p-1 rounded min-h-[24px] font-semibold"
      onClick={() => setIsEditing(true)}
    >
      {value || (
        <span className="text-muted-foreground italic font-normal">Untitled</span>
      )}
    </div>
  );
}
