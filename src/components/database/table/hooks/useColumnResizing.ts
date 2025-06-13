
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
    // Don't allow resizing of checkbox and actions columns
    if (fieldId === 'checkbox' || fieldId === 'actions') {
      return;
    }

    // Ensure width is within bounds and use exact values
    const constrainedWidth = Math.min(Math.max(Math.round(width), minWidth), maxWidth);
    
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
    // Fixed widths for special columns
    if (fieldId === 'checkbox') return 48;
    if (fieldId === 'actions') return 64;
    
    // Dynamic width for other columns
    const width = columnWidths[fieldId] || defaultWidths[fieldId] || (fieldId === 'title' ? 280 : 200);
    return Math.round(width); // Ensure integer values for consistent layout
  }, [columnWidths, defaultWidths]);

  return {
    columnWidths,
    updateColumnWidth,
    resetColumnWidth,
    resetAllWidths,
    getColumnWidth
  };
}
