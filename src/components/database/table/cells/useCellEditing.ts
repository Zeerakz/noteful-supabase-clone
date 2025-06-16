
import { useState, useRef, useEffect, useCallback } from 'react';

interface UseCellEditingProps {
  value: string;
  onSave: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  multiline?: boolean;
}

export function useCellEditing({
  value,
  onSave,
  onBlur,
  onFocus,
  multiline = false
}: UseCellEditingProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(() => {
    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    onSave(localValue);
    setIsEditing(false);
    onBlur?.();
  }, [localValue, onSave, onBlur]);

  const handleCancel = useCallback(() => {
    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    setLocalValue(value);
    setIsEditing(false);
    onBlur?.();
  }, [value, onBlur]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
    } else if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancel();
    }
  }, [multiline, handleSave, handleCancel]);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Prevent blur handling if the focus is moving to an element within our container
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && containerRef.current?.contains(relatedTarget)) {
      return;
    }

    // Also check if we're clicking on another cell in the same row
    if (relatedTarget && relatedTarget.closest('tr') === e.currentTarget.closest('tr')) {
      return;
    }

    // Use a timeout to allow for potential re-focus events
    saveTimeoutRef.current = setTimeout(() => {
      if (isEditing) {
        handleSave();
      }
    }, 100);
  }, [isEditing, handleSave]);

  const handleFocus = useCallback(() => {
    // Clear any pending save timeout when focusing
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    onFocus?.();
  }, [onFocus]);

  return {
    isEditing,
    localValue,
    setLocalValue,
    containerRef,
    handleClick,
    handleSave,
    handleCancel,
    handleKeyDown,
    handleBlur,
    handleFocus
  };
}
