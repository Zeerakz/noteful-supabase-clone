
import { useState, useEffect, useCallback } from 'react';

interface TableData {
  headers: string[];
  rows: string[][];
}

export function useTableData(initialContent: any, onUpdate: (content: any) => Promise<void>) {
  const [tableData, setTableData] = useState<TableData>(() => {
    // Initialize with default table structure if no content exists
    if (!initialContent || !initialContent.headers || !initialContent.rows) {
      return {
        headers: ['Column 1', 'Column 2', 'Column 3'],
        rows: [
          ['', '', ''],
          ['', '', ''],
        ],
      };
    }
    return initialContent;
  });

  // Update parent when table data changes
  const updateTable = useCallback(async (newData: TableData) => {
    setTableData(newData);
    try {
      console.log('Updating table data:', newData);
      await onUpdate(newData);
    } catch (error) {
      console.error('Failed to update table data:', error);
    }
  }, [onUpdate]);

  const updateCell = useCallback(async (rowIndex: number, columnIndex: number, content: any) => {
    const newData = { ...tableData };
    // Handle both string content and object content with text property
    const cellValue = typeof content === 'string' ? content : (content?.text || content || '');
    newData.rows[rowIndex][columnIndex] = cellValue;
    await updateTable(newData);
  }, [tableData, updateTable]);

  const updateColumnHeader = useCallback(async (columnIndex: number, content: any) => {
    const newData = { ...tableData };
    // Handle both string content and object content with text property
    const headerValue = typeof content === 'string' ? content : (content?.text || content || '');
    newData.headers[columnIndex] = headerValue;
    await updateTable(newData);
  }, [tableData, updateTable]);

  const addRow = useCallback(async () => {
    const newData = { ...tableData };
    const newRow = new Array(tableData.headers.length).fill('');
    newData.rows.push(newRow);
    await updateTable(newData);
  }, [tableData, updateTable]);

  const removeRow = useCallback(async (rowIndex: number) => {
    if (tableData.rows.length <= 1) return; // Keep at least one row
    
    const newData = { ...tableData };
    newData.rows.splice(rowIndex, 1);
    await updateTable(newData);
  }, [tableData, updateTable]);

  const addColumn = useCallback(async () => {
    const newData = { ...tableData };
    const columnCount = tableData.headers.length + 1;
    newData.headers.push(`Column ${columnCount}`);
    
    // Add empty cell to each row
    newData.rows.forEach(row => {
      row.push('');
    });
    
    await updateTable(newData);
  }, [tableData, updateTable]);

  const removeColumn = useCallback(async (columnIndex: number) => {
    if (tableData.headers.length <= 1) return; // Keep at least one column
    
    const newData = { ...tableData };
    newData.headers.splice(columnIndex, 1);
    
    // Remove cell from each row
    newData.rows.forEach(row => {
      row.splice(columnIndex, 1);
    });
    
    await updateTable(newData);
  }, [tableData, updateTable]);

  return {
    tableData,
    updateCell,
    addRow,
    removeRow,
    addColumn,
    removeColumn,
    updateColumnHeader,
  };
}
