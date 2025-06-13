
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
        group hover:bg-muted/30 border-t border-border/40
        ${isAnyColumnResizing ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      {/* Empty checkbox cell */}
      <TableCell style={{ width: '48px' }}>
        <div className="flex items-center justify-center">
          <div className="w-4 h-4" />
        </div>
      </TableCell>

      {/* Title Cell */}
      <TableCell style={{ width: `${getColumnWidth('title')}px` }}>
        <Button
          variant="ghost"
          onClick={handleCreateRow}
          disabled={isAnyColumnResizing}
          className={`
            w-full justify-start h-10 px-3 rounded-lg
            ${!isAnyColumnResizing 
              ? 'text-muted-foreground hover:text-foreground hover:bg-accent/30' 
              : 'cursor-not-allowed text-muted-foreground/40'
            }
          `}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="font-medium">New</span>
        </Button>
      </TableCell>

      {/* Property Cells - Empty placeholders */}
      {fields.map((field) => (
        <TableCell 
          key={field.id} 
          style={{ width: `${getColumnWidth(field.id)}px` }}
        >
          <div className="h-10 flex items-center px-2 text-muted-foreground/40">
            {/* Empty placeholder */}
          </div>
        </TableCell>
      ))}

      {/* Empty Actions Cell */}
      <TableCell style={{ width: '64px' }}>
        <div className="w-8 h-8" />
      </TableCell>
    </TableRow>
  );
}
