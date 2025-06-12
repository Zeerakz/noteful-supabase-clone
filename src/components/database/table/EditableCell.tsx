
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  fieldType?: string;
  fieldConfig?: any;
  placeholder?: string;
}

export function EditableCell({ 
  value, 
  onSave, 
  fieldType, 
  fieldConfig, 
  placeholder = "Enter value..." 
}: EditableCellProps) {
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
    if (e.key === 'Enter' && !fieldConfig?.multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const isMultiline = fieldType === 'text' && fieldConfig?.multiline;
  const shouldWrap = fieldType === 'text' && fieldConfig?.wrapText;

  if (isEditing) {
    if (isMultiline) {
      return (
        <Textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="border-0 bg-transparent p-0 focus-visible:ring-1 resize-none min-h-[60px]"
          placeholder={placeholder}
          autoFocus
          rows={3}
        />
      );
    }

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

  const displayValue = value || placeholder;
  const isEmpty = !value;
  const isMultilineContent = value && value.includes('\n');

  if (shouldWrap || isMultilineContent) {
    return (
      <div
        className={`min-h-[20px] cursor-text hover:bg-muted/50 p-1 rounded ${
          shouldWrap ? 'whitespace-pre-wrap break-words' : ''
        }`}
        onClick={() => setIsEditing(true)}
      >
        {isEmpty ? (
          <span className="text-muted-foreground italic">{placeholder}</span>
        ) : (
          <span className={shouldWrap ? 'whitespace-pre-wrap' : ''}>{value}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className="min-h-[20px] cursor-text hover:bg-muted/50 p-1 rounded truncate"
      onClick={() => setIsEditing(true)}
    >
      {isEmpty ? (
        <span className="text-muted-foreground italic">{placeholder}</span>
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
}
