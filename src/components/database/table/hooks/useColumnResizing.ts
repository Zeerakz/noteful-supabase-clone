
import { useState, useCallback } from 'react';

interface UseColumnResizingProps {
  defaultWidths?: Record<string, number>;
  minWidth?: number;
  maxWidth?: number;
}

export function useColumnResizing({
  defaultWidths = {},
  minWidth = 100,
  maxWidth = 500
}: UseColumnResizingProps = {}) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(defaultWidths);

  const updateColumnWidth = useCallback((fieldId: string, width: number) => {
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
    setColumnWidths({});
  }, []);

  return {
    columnWidths,
    updateColumnWidth,
    resetColumnWidth,
    resetAllWidths
  };
}
