
import React, { useState, useCallback } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CrdtTextEditor } from './CrdtTextEditor/CrdtTextEditor';
import { useTableData } from './table/hooks/useTableData';
import { TableToolbar } from './table/components/TableToolbar';
import { TableCell as CustomTableCell } from './table/components/TableCell';
import { Block } from '@/hooks/useBlocks';

interface TableBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

export function TableBlock({ block, onUpdate, onDelete, isEditable }: TableBlockProps) {
  const {
    tableData,
    updateCell,
    addRow,
    removeRow,
    addColumn,
    removeColumn,
    updateColumnHeader,
  } = useTableData(block.content, onUpdate);

  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

  const handleCellUpdate = useCallback(async (rowIndex: number, columnIndex: number, content: any) => {
    await updateCell(rowIndex, columnIndex, content);
  }, [updateCell]);

  const handleColumnHeaderUpdate = useCallback(async (columnIndex: number, content: any) => {
    await updateColumnHeader(columnIndex, content);
  }, [updateColumnHeader]);

  if (!tableData || !tableData.headers || !tableData.rows) {
    return (
      <div className="border border-border rounded-lg p-4">
        <div className="text-muted-foreground text-center">
          Invalid table data
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {isEditable && (
        <TableToolbar
          onAddRow={() => addRow()}
          onAddColumn={() => addColumn()}
          onDelete={onDelete}
        />
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-muted/50">
            <tr>
              {tableData.headers.map((header, columnIndex) => (
                <th
                  key={columnIndex}
                  className="relative border-r border-border last:border-r-0"
                  onMouseEnter={() => setHoveredColumn(columnIndex)}
                  onMouseLeave={() => setHoveredColumn(null)}
                >
                  <div className="p-2 min-w-[120px]">
                    {isEditable ? (
                      <CrdtTextEditor
                        pageId={block.page_id}
                        blockId={`${block.id}-header-${columnIndex}`}
                        initialContent={header}
                        onContentChange={(content) => handleColumnHeaderUpdate(columnIndex, content)}
                        placeholder="Column header"
                        className="font-medium text-left"
                      />
                    ) : (
                      <div
                        className="font-medium text-left"
                        dangerouslySetInnerHTML={{ __html: header }}
                      />
                    )}
                  </div>
                  
                  {/* Column actions */}
                  {isEditable && hoveredColumn === columnIndex && tableData.headers.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeColumn(columnIndex)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </th>
              ))}
              
              {/* Add column button */}
              {isEditable && (
                <th className="w-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => addColumn()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </th>
              )}
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-t border-border hover:bg-muted/25 group"
                onMouseEnter={() => setHoveredRow(rowIndex)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {row.map((cell, columnIndex) => (
                  <CustomTableCell
                    key={columnIndex}
                    content={cell}
                    pageId={block.page_id}
                    blockId={`${block.id}-cell-${rowIndex}-${columnIndex}`}
                    isEditable={isEditable}
                    onUpdate={(content) => handleCellUpdate(rowIndex, columnIndex, content)}
                  />
                ))}
                
                {/* Row actions */}
                {isEditable && (
                  <td className="w-8 border-l border-border">
                    <div className="flex items-center justify-center h-full">
                      {hoveredRow === rowIndex && tableData.rows.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeRow(rowIndex)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            
            {/* Add row button */}
            {isEditable && (
              <tr>
                <td colSpan={tableData.headers.length + 1} className="text-center py-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => addRow()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row
                  </Button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
