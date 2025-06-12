import React, { useState, useRef, useMemo } from 'react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, MoreHorizontal, MoreVertical, ArrowUp, ArrowDown, Filter, FilterX } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CommentIcon } from './CommentIcon';
import { CommentThreadPanel } from './CommentThreadPanel';
import { useComments } from '@/hooks/useComments';

interface TableCell {
  id: string;
  content: string;
}

interface TableRow {
  id: string;
  cells: TableCell[];
}

interface TableData {
  headers: TableCell[];
  rows: TableRow[];
}

interface SortConfig {
  columnIndex: number | null;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  [columnIndex: number]: string;
}

interface TableBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function TableBlock({ block, onUpdate, onDelete, isEditable }: TableBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ columnIndex: null, direction: 'asc' });
  const [filters, setFilters] = useState<FilterConfig>({});
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { comments } = useComments(block.id);

  // Initialize table data with defaults if not present
  const getTableData = (): TableData => {
    if (block.content?.table) {
      return block.content.table;
    }
    
    // Default 3x3 table
    const defaultHeaders = Array.from({ length: 3 }, (_, i) => ({
      id: `header-${i}`,
      content: `Column ${i + 1}`
    }));
    
    const defaultRows = Array.from({ length: 3 }, (_, rowIndex) => ({
      id: `row-${rowIndex}`,
      cells: Array.from({ length: 3 }, (_, colIndex) => ({
        id: `cell-${rowIndex}-${colIndex}`,
        content: ''
      }))
    }));

    return {
      headers: defaultHeaders,
      rows: defaultRows
    };
  };

  const [tableData, setTableData] = useState<TableData>(getTableData());

  // Filter and sort the table data
  const processedTableData = useMemo(() => {
    let filteredRows = [...tableData.rows];

    // Apply filters
    Object.entries(filters).forEach(([columnIndex, filterValue]) => {
      if (filterValue.trim()) {
        const colIndex = parseInt(columnIndex);
        filteredRows = filteredRows.filter(row => {
          const cellContent = row.cells[colIndex]?.content || '';
          return cellContent.toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortConfig.columnIndex !== null) {
      filteredRows.sort((a, b) => {
        const aValue = a.cells[sortConfig.columnIndex!]?.content || '';
        const bValue = b.cells[sortConfig.columnIndex!]?.content || '';
        
        // Try to parse as numbers for numeric sorting
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        
        let comparison = 0;
        if (!isNaN(aNum) && !isNaN(bNum)) {
          comparison = aNum - bNum;
        } else {
          comparison = aValue.localeCompare(bValue);
        }
        
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return {
      headers: tableData.headers,
      rows: filteredRows
    };
  }, [tableData, filters, sortConfig]);

  const saveTableData = async (newTableData: TableData) => {
    setTableData(newTableData);
    await onUpdate({ table: newTableData });
  };

  const updateCellContent = async (rowIndex: number, colIndex: number, content: string) => {
    const newTableData = { ...tableData };
    
    if (rowIndex === -1) {
      // Update header
      newTableData.headers[colIndex].content = content;
    } else {
      // Find the original row in unfiltered data
      const originalRowId = processedTableData.rows[rowIndex]?.id;
      const originalRowIndex = newTableData.rows.findIndex(row => row.id === originalRowId);
      if (originalRowIndex !== -1) {
        newTableData.rows[originalRowIndex].cells[colIndex].content = content;
      }
    }
    
    await saveTableData(newTableData);
  };

  const handleSort = (columnIndex: number) => {
    setSortConfig(prev => ({
      columnIndex,
      direction: prev.columnIndex === columnIndex && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (columnIndex: number, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnIndex]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter.trim());

  // ... keep existing code (addColumn, removeColumn, addRow, removeRow functions) the same ...

  const addColumn = async () => {
    const newTableData = { ...tableData };
    const colIndex = newTableData.headers.length;
    
    // Add header
    newTableData.headers.push({
      id: `header-${colIndex}`,
      content: `Column ${colIndex + 1}`
    });
    
    // Add cell to each row
    newTableData.rows.forEach((row, rowIndex) => {
      row.cells.push({
        id: `cell-${rowIndex}-${colIndex}`,
        content: ''
      });
    });
    
    await saveTableData(newTableData);
  };

  const removeColumn = async (colIndex: number) => {
    if (tableData.headers.length <= 1) return; // Keep at least one column
    
    const newTableData = { ...tableData };
    
    // Remove header
    newTableData.headers.splice(colIndex, 1);
    
    // Remove cell from each row
    newTableData.rows.forEach(row => {
      row.cells.splice(colIndex, 1);
    });
    
    // Clear sort if it was on the removed column
    if (sortConfig.columnIndex === colIndex) {
      setSortConfig({ columnIndex: null, direction: 'asc' });
    }
    
    // Clear filter for the removed column
    const newFilters = { ...filters };
    delete newFilters[colIndex];
    // Shift filters for columns after the removed one
    Object.keys(newFilters).forEach(key => {
      const keyNum = parseInt(key);
      if (keyNum > colIndex) {
        newFilters[keyNum - 1] = newFilters[keyNum];
        delete newFilters[keyNum];
      }
    });
    setFilters(newFilters);
    
    await saveTableData(newTableData);
  };

  const addRow = async () => {
    const newTableData = { ...tableData };
    const rowIndex = newTableData.rows.length;
    
    const newRow: TableRow = {
      id: `row-${rowIndex}`,
      cells: tableData.headers.map((_, colIndex) => ({
        id: `cell-${rowIndex}-${colIndex}`,
        content: ''
      }))
    };
    
    newTableData.rows.push(newRow);
    await saveTableData(newTableData);
  };

  const removeRow = async (rowIndex: number) => {
    if (tableData.rows.length <= 1) return; // Keep at least one row
    
    // Find the original row in unfiltered data
    const originalRowId = processedTableData.rows[rowIndex]?.id;
    const originalRowIndex = tableData.rows.findIndex(row => row.id === originalRowId);
    
    if (originalRowIndex === -1) return;
    
    const newTableData = { ...tableData };
    newTableData.rows.splice(originalRowIndex, 1);
    await saveTableData(newTableData);
  };

  // ... keep existing code (startEditing, stopEditing, handleKeyDown, getCellContent, isCurrentlyEditing functions) the same ...

  const startEditing = (rowIndex: number, colIndex: number) => {
    if (!isEditable) return;
    
    setEditingCell({ row: rowIndex, col: colIndex });
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const stopEditing = async () => {
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      stopEditing();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCell(null);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      stopEditing();
      
      // Move to next cell
      if (colIndex < tableData.headers.length - 1) {
        startEditing(rowIndex, colIndex + 1);
      } else if (rowIndex < processedTableData.rows.length - 1) {
        startEditing(rowIndex + 1, 0);
      }
    }
  };

  const getCellContent = (rowIndex: number, colIndex: number): string => {
    if (rowIndex === -1) {
      return tableData.headers[colIndex]?.content || '';
    }
    return processedTableData.rows[rowIndex]?.cells[colIndex]?.content || '';
  };

  const isCurrentlyEditing = (rowIndex: number, colIndex: number): boolean => {
    return editingCell?.row === rowIndex && editingCell?.col === colIndex;
  };

  if (!isEditable) {
    return (
      <div className="py-2">
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                {tableData.headers.map((header, colIndex) => (
                  <th key={header.id} className="border-r border-border last:border-r-0 p-3 text-left font-medium">
                    {header.content || `Column ${colIndex + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row, rowIndex) => (
                <tr key={row.id} className="border-t border-border">
                  {row.cells.map((cell, colIndex) => (
                    <td key={cell.id} className="border-r border-border last:border-r-0 p-3">
                      {cell.content || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Controls */}
      <div className="mb-2 flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-7"
          >
            <Filter className="h-3 w-3 mr-1" />
            Filter
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-muted-foreground"
            >
              <FilterX className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
          
          {sortConfig.columnIndex !== null && (
            <div className="text-xs text-muted-foreground">
              Sorted by column {sortConfig.columnIndex + 1} ({sortConfig.direction})
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          {processedTableData.rows.length} of {tableData.rows.length} rows
        </div>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full">
          <thead>
            {/* Filter row */}
            {showFilters && (
              <tr className="bg-muted/30">
                {tableData.headers.map((_, colIndex) => (
                  <th key={`filter-${colIndex}`} className="border-r border-border last:border-r-0 p-1">
                    <Input
                      placeholder="Filter..."
                      value={filters[colIndex] || ''}
                      onChange={(e) => handleFilterChange(colIndex, e.target.value)}
                      className="h-7 text-xs border-none bg-transparent"
                    />
                  </th>
                ))}
                <th className="w-8 bg-muted/30"></th>
              </tr>
            )}
            
            {/* Header row */}
            <tr className="bg-muted/50">
              {tableData.headers.map((header, colIndex) => (
                <th key={header.id} className="border-r border-border last:border-r-0 p-0 relative group/cell">
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {isCurrentlyEditing(-1, colIndex) ? (
                          <Input
                            ref={inputRef}
                            value={getCellContent(-1, colIndex)}
                            onChange={(e) => updateCellContent(-1, colIndex, e.target.value)}
                            onBlur={stopEditing}
                            onKeyDown={(e) => handleKeyDown(e, -1, colIndex)}
                            className="border-none bg-transparent p-3 h-auto font-medium"
                          />
                        ) : (
                          <div
                            onClick={() => startEditing(-1, colIndex)}
                            className="p-3 cursor-text min-h-[2.5rem] flex items-center font-medium hover:bg-accent/50"
                          >
                            {header.content || `Column ${colIndex + 1}`}
                          </div>
                        )}
                      </div>
                      
                      {/* Sort button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort(colIndex)}
                        className="h-6 w-6 p-0 mr-1"
                      >
                        {sortConfig.columnIndex === colIndex ? (
                          sortConfig.direction === 'asc' ? 
                            <ArrowUp className="h-3 w-3" /> : 
                            <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUp className="h-3 w-3 opacity-30" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Column actions */}
                    <div className="absolute top-1 right-8 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={addColumn}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Column
                          </DropdownMenuItem>
                          {tableData.headers.length > 1 && (
                            <DropdownMenuItem onClick={() => removeColumn(colIndex)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Column
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </th>
              ))}
              <th className="w-8 bg-muted/30">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addColumn}
                  className="h-6 w-6 p-0 mx-auto"
                  title="Add Column"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {processedTableData.rows.map((row, rowIndex) => (
              <tr key={row.id} className="border-t border-border group/row">
                {row.cells.map((cell, colIndex) => (
                  <td key={cell.id} className="border-r border-border last:border-r-0 p-0 relative group/cell">
                    {isCurrentlyEditing(rowIndex, colIndex) ? (
                      <Input
                        ref={inputRef}
                        value={getCellContent(rowIndex, colIndex)}
                        onChange={(e) => updateCellContent(rowIndex, colIndex, e.target.value)}
                        onBlur={stopEditing}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                        className="border-none bg-transparent p-3 h-auto"
                      />
                    ) : (
                      <div
                        onClick={() => startEditing(rowIndex, colIndex)}
                        className="p-3 cursor-text min-h-[2.5rem] flex items-center hover:bg-accent/30"
                      >
                        {cell.content || ''}
                      </div>
                    )}
                  </td>
                ))}
                <td className="w-8 bg-muted/30 relative">
                  <div className="opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center h-full">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={addRow}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Row
                        </DropdownMenuItem>
                        {tableData.rows.length > 1 && (
                          <DropdownMenuItem onClick={() => removeRow(rowIndex)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Row
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={tableData.headers.length} className="p-2 text-center bg-muted/30">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addRow}
                  className="h-6"
                  title="Add Row"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Row
                </Button>
              </td>
              <td className="w-8 bg-muted/30"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {isHovered && (
        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
          <CommentThreadPanel
            blockId={block.id}
            isOpen={isCommentPanelOpen}
            onOpenChange={setIsCommentPanelOpen}
          >
            <CommentIcon
              hasComments={comments.length > 0}
              commentCount={comments.length}
              onClick={() => setIsCommentPanelOpen(true)}
            />
          </CommentThreadPanel>
          
          <Button
            onClick={onDelete}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
