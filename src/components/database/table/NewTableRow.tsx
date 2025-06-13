
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
        group border-b-0 transition-all duration-300 ease-out motion-content-drift-in
        hover:bg-accent/10
        bg-background/80
        ${isAnyColumnResizing ? 'pointer-events-none opacity-60' : ''}
        border-t border-border/40
      `}
    >
      {/* Empty checkbox cell */}
      <TableCell 
        className="p-3 border-r border-border/20 text-center"
        style={{ width: '48px' }}
      >
        <div className="w-4 h-4" />
      </TableCell>

      {/* Title Cell with Create Button */}
      <TableCell 
        className="p-3 border-r border-border/20"
        style={{ width: `${getColumnWidth('title')}px` }}
      >
        <Button
          variant="ghost"
          onClick={handleCreateRow}
          disabled={isAnyColumnResizing}
          className={`
            w-full justify-start h-10 px-3 rounded-lg transition-all duration-300 ease-out motion-interactive motion-focus-ring
            ${!isAnyColumnResizing 
              ? 'text-muted-foreground hover:text-foreground hover:bg-accent/30' 
              : 'cursor-not-allowed text-muted-foreground/40'
            }
          `}
        >
          <Plus className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
          <span className="font-medium">New</span>
        </Button>
      </TableCell>

      {/* Property Cells - Empty placeholders with subtle hover */}
      {fields.map((field) => (
        <TableCell 
          key={field.id} 
          className="p-3 border-r border-border/20 last:border-r-0"
          style={{ width: `${getColumnWidth(field.id)}px` }}
        >
          <div 
            className={`
              min-h-[32px] px-2 py-1 flex items-center rounded-sm transition-all duration-300 ease-out
              ${isAnyColumnResizing ? 'text-muted-foreground/20' : 'text-muted-foreground/40 hover:bg-muted/10 motion-interactive'}
              bg-transparent
            `}
          >
            {/* Empty placeholder */}
          </div>
        </TableCell>
      ))}

      {/* Empty Actions Cell */}
      <TableCell 
        className="p-3 text-center"
        style={{ width: '64px' }}
      >
        <div className="w-8 h-8" />
      </TableCell>
    </TableRow>
  );
}
