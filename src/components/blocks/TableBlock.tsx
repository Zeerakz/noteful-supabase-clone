
import React from 'react';
import { Block } from '@/hooks/useBlocks';
import { TableToolbar } from './table/components/TableToolbar';
import { TableCell } from './table/components/TableCell';
import { useTableData } from './table/hooks/useTableData';

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
    addColumn,
    removeRow,
    removeColumn,
    updateColumnHeader,
  } = useTableData(block.content, onUpdate);

  const handleCellUpdate = async (rowIndex: number, columnIndex: number, content: any) => {
    console.log('Cell update triggered:', { rowIndex, columnIndex, content });
    await updateCell(rowIndex, columnIndex, content);
  };

  const handleHeaderUpdate = async (columnIndex: number, content: any) => {
    console.log('Header update triggered:', { columnIndex, content });
    await updateColumnHeader(columnIndex, content);
  };

  if (!tableData || !tableData.headers || !tableData.rows) {
    return (
      <div className="border border-border rounded-lg overflow-hidden bg-background">
        <div className="p-4 text-center text-muted-foreground">
          Loading table...
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      {isEditable && (
        <TableToolbar
          onAddRow={addRow}
          onAddColumn={addColumn}
          onDelete={onDelete}
        />
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/25 border-b border-border">
            <tr>
              {tableData.headers.map((header, columnIndex) => (
                <th key={columnIndex} className="border-r border-border last:border-r-0">
                  <div className="p-2 font-medium">
                    {isEditable ? (
                      <TableCell
                        content={header}
                        pageId={block.page_id}
                        blockId={`${block.id}-header-${columnIndex}`}
                        isEditable={isEditable}
                        onUpdate={(content) => handleHeaderUpdate(columnIndex, content)}
                      />
                    ) : (
                      <div className="text-sm font-medium min-h-[20px]">
                        {header || `Column ${columnIndex + 1}`}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border last:border-b-0">
                {row.map((cell, columnIndex) => (
                  <TableCell
                    key={`${rowIndex}-${columnIndex}`}
                    content={cell}
                    pageId={block.page_id}
                    blockId={`${block.id}-${rowIndex}-${columnIndex}`}
                    isEditable={isEditable}
                    onUpdate={(content) => handleCellUpdate(rowIndex, columnIndex, content)}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
