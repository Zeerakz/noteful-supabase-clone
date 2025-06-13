
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
}

export function EditableCell({
  value,
  onChange,
  className,
  placeholder = "Empty",
  disabled = false,
  multiline = false,
  onBlur,
  onFocus
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleSubmit = () => {
    onChange(localValue);
    setIsEditing(false);
    onBlur?.();
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Enter' && multiline && e.metaKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      onFocus?.();
    }
  }, [isEditing, onFocus]);

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input';
    
    return (
      <InputComponent
        ref={inputRef as any}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full h-full bg-background border border-border rounded-sm outline-none resize-none px-2 py-1",
          "text-sm font-normal text-foreground leading-relaxed",
          "focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary",
          "tracking-normal",
          className
        )}
        style={{ 
          minHeight: multiline ? '60px' : 'auto',
          fontFamily: 'inherit'
        }}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "w-full h-full cursor-text select-text px-2 py-1 rounded-sm",
        "text-sm font-normal text-foreground leading-relaxed",
        "hover:bg-muted/30 focus:bg-background transition-colors",
        "border-none outline-none tracking-normal",
        // Empty state styling
        !value && "text-muted-foreground/60 italic",
        disabled && "cursor-default",
        className
      )}
      style={{ fontFamily: 'inherit' }}
    >
      {value || placeholder}
    </div>
  );
}
