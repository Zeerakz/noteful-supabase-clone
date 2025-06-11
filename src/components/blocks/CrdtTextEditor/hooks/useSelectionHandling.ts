
import { useState, useCallback } from 'react';
import { ToolbarPosition } from '../types';

export function useSelectionHandling(isEditMode: boolean) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({ top: 0, left: 0 });

  const handleMouseUp = useCallback(() => {
    if (!isEditMode) return;
    
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setToolbarPosition({
        top: rect.top - 50,
        left: rect.left + (rect.width / 2) - 100,
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  }, [isEditMode]);

  const hideToolbar = useCallback(() => {
    setTimeout(() => setShowToolbar(false), 150);
  }, []);

  return {
    showToolbar,
    toolbarPosition,
    handleMouseUp,
    hideToolbar,
  };
}
