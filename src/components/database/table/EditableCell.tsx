
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleSubmit = () => {
    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    onChange(localValue);
    setIsEditing(false);
    onBlur?.();
  };

  const handleCancel = () => {
    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    setLocalValue(value);
    setIsEditing(false);
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Check if the blur is due to clicking on something else in the same row
    const relatedTarget = e.relatedTarget as HTMLElement;
    
    // Don't save immediately if clicking on another input in the same table row
    if (relatedTarget && relatedTarget.closest('tr') === e.currentTarget.closest('tr')) {
      return;
    }

    // Use a timeout to allow for potential re-focus events
    saveTimeoutRef.current = setTimeout(() => {
      if (isEditing) {
        handleSubmit();
      }
    }, 100);
  };

  const handleFocus = () => {
    // Clear any pending save timeout when focusing
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    onFocus?.();
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input';
    
    return (
      <InputComponent
        ref={inputRef as any}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onFocus={handleFocus}
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
