
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  fieldType?: string;
  fieldConfig?: any;
  placeholder?: string;
  disabled?: boolean;
  isResizing?: boolean;
}

export function EditableCell({ 
  value, 
  onSave, 
  fieldType, 
  fieldConfig, 
  placeholder = "Enter value...",
  disabled = false,
  isResizing = false
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

  const handleClick = () => {
    if (!disabled && !isResizing) {
      setIsEditing(true);
    }
  };

  const isMultiline = fieldType === 'text' && fieldConfig?.multiline;
  const shouldWrap = fieldType === 'text' && fieldConfig?.wrapText;

  if (isEditing && !disabled && !isResizing) {
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
        className={`
          min-h-[20px] p-1 rounded transition-colors duration-150
          ${disabled || isResizing ? 'cursor-default' : 'cursor-text'}
          ${!disabled && !isResizing ? 'hover:bg-muted/50' : ''}
          ${shouldWrap ? 'whitespace-pre-wrap break-words' : ''}
        `}
        onClick={handleClick}
      >
        {isEmpty ? (
          <span className={`editable-cell-placeholder ${isResizing ? 'text-muted-foreground/40' : ''}`}>
            {placeholder}
          </span>
        ) : (
          <span className={shouldWrap ? 'whitespace-pre-wrap' : ''}>{value}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        min-h-[20px] p-1 rounded truncate transition-colors duration-150
        ${disabled || isResizing ? 'cursor-default' : 'cursor-text'}
        ${!disabled && !isResizing ? 'hover:bg-muted/50' : ''}
      `}
      onClick={handleClick}
    >
      {isEmpty ? (
        <span className={`editable-cell-placeholder ${isResizing ? 'text-muted-foreground/40' : ''}`}>
          {placeholder}
        </span>
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
}
