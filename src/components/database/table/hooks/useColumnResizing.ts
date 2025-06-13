
import { useState, useCallback } from 'react';

interface UseColumnResizingProps {
  defaultWidths?: Record<string, number>;
  minWidth?: number;
  maxWidth?: number;
}

export function useColumnResizing({
  defaultWidths = {},
  minWidth = 120,
  maxWidth = 600
}: UseColumnResizingProps = {}) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(defaultWidths);

  const updateColumnWidth = useCallback((fieldId: string, width: number) => {
    // Allow both expanding and shrinking while respecting constraints
    const constrainedWidth = Math.min(Math.max(width, minWidth), maxWidth);
    
    setColumnWidths(prev => ({
      ...prev,
      [fieldId]: constrainedWidth
    }));
  }, [minWidth, maxWidth]);

  const resetColumnWidth = useCallback((fieldId: string) => {
    setColumnWidths(prev => {
      const newWidths = { ...prev };
      delete newWidths[fieldId];
      return newWidths;
    });
  }, []);

  const resetAllWidths = useCallback(() => {
    setColumnWidths(defaultWidths);
  }, [defaultWidths]);

  const getColumnWidth = useCallback((fieldId: string) => {
    return columnWidths[fieldId] || defaultWidths[fieldId] || (fieldId === 'title' ? 280 : 200);
  }, [columnWidths, defaultWidths]);

  return {
    columnWidths,
    updateColumnWidth,
    resetColumnWidth,
    resetAllWidths,
    getColumnWidth
  };
}
