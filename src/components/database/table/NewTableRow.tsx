
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DatabaseField } from '@/types/database';

interface NewTableRowProps {
  fields: DatabaseField[];
  onCreateRow: (title?: string) => void;
  getColumnWidth: (fieldId: string) => number;
  isEvenRow?: boolean;
  resizingFields?: Set<string>;
}

export function NewTableRow({
  fields,
  onCreateRow,
  getColumnWidth,
  isEvenRow = false,
  resizingFields = new Set()
}: NewTableRowProps) {
  const isAnyColumnResizing = resizingFields.size > 0;

  const handleCreateRow = async () => {
    if (!isAnyColumnResizing) {
      try {
        await onCreateRow('Untitled');
      } catch (error) {
        console.error('Failed to create row:', error);
      }
    }
  };

  return (
    <TableRow 
      className={`
        group border-b-0 transition-all duration-200 
        ${!isAnyColumnResizing ? 'hover:bg-accent/30' : ''}
        bg-background/80
        ${isAnyColumnResizing ? 'pointer-events-none opacity-60' : ''}
        border-t border-border/40
      `}
    >
      {/* Empty checkbox cell with consistent width */}
      <TableCell 
        className="p-3 border-r border-border/20"
        style={{ width: '48px', minWidth: '48px', maxWidth: '48px' }}
      >
        <div className="flex items-center justify-center">
          <div className="w-4 h-4" />
        </div>
      </TableCell>

      {/* Title Cell with consistent width */}
      <TableCell 
        className="p-0 border-r border-border/20"
        style={{ 
          width: `${getColumnWidth('title')}px`, 
          minWidth: `${getColumnWidth('title')}px`, 
          maxWidth: `${getColumnWidth('title')}px` 
        }}
      >
        <div className="px-4 py-3">
          <Button
            variant="ghost"
            onClick={handleCreateRow}
            disabled={isAnyColumnResizing}
            className={`
              w-full justify-start h-10 px-3 rounded-lg transition-all duration-200
              ${!isAnyColumnResizing 
                ? 'text-muted-foreground hover:text-foreground hover:bg-accent/40' 
                : 'cursor-not-allowed text-muted-foreground/40'
              }
            `}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="font-medium">New</span>
          </Button>
        </div>
      </TableCell>

      {/* Property Cells - Simplified placeholders */}
      {fields.map((field) => (
        <TableCell 
          key={field.id} 
          className="p-0 border-r border-border/20 last:border-r-0"
          style={{ 
            width: `${getColumnWidth(field.id)}px`, 
            minWidth: `${getColumnWidth(field.id)}px`, 
            maxWidth: `${getColumnWidth(field.id)}px` 
          }}
        >
          <div className="px-4 py-3 overflow-hidden">
            <div 
              className={`
                min-h-[32px] px-2 py-1 flex items-center rounded-sm
                ${isAnyColumnResizing ? 'text-muted-foreground/20' : 'text-muted-foreground/40'}
                bg-background
              `}
            >
              <span className="text-sm">
                {/* Empty placeholder - users will edit inline after row creation */}
              </span>
            </div>
          </div>
        </TableCell>
      ))}

      {/* Empty Actions Cell with consistent width */}
      <TableCell 
        className="p-3"
        style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}
      >
        <div className="w-8 h-8" />
      </TableCell>
    </TableRow>
  );
}
