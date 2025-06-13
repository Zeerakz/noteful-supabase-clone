
import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Check, X } from 'lucide-react';
import { DatabaseField } from '@/types/database';

interface NewTableRowProps {
  fields: DatabaseField[];
  onCreateRow: (title?: string) => void;
  columnWidths?: Record<string, number>;
  isEvenRow?: boolean;
  resizingFields?: Set<string>;
}

export function NewTableRow({
  fields,
  onCreateRow,
  columnWidths = {},
  isEvenRow = false,
  resizingFields = new Set()
}: NewTableRowProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');

  const isAnyColumnResizing = resizingFields.size > 0;

  const handleStartCreating = () => {
    if (!isAnyColumnResizing) {
      setIsCreating(true);
      setTitle('');
    }
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    try {
      await onCreateRow(trimmedTitle || 'Untitled');
      setIsCreating(false);
      setTitle('');
    } catch (error) {
      console.error('Failed to create row:', error);
      // Keep the form open on error
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <TableRow 
      className={`
        group border-b border-border/20 transition-colors duration-150
        ${!isAnyColumnResizing && !isCreating ? 'hover:bg-accent/20' : ''}
        ${isEvenRow ? 'bg-muted/10' : 'bg-background'}
        ${isCreating ? 'bg-accent/10 border-accent/30' : ''}
        ${isAnyColumnResizing ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      {/* Empty checkbox cell */}
      <TableCell 
        className="w-12 p-3 border-r border-border/20"
        style={{ width: '48px', minWidth: '48px', maxWidth: '48px' }}
      >
        <div className="flex items-center justify-center">
          <div className="w-4 h-4" />
        </div>
      </TableCell>

      {/* Title Cell */}
      <TableCell 
        className={`
          p-0 border-r border-border/20
          ${resizingFields.has('title') ? 'resize-active' : ''}
        `}
        style={{ 
          width: columnWidths['title'] ? `${columnWidths['title']}px` : '280px',
          minWidth: '150px'
        }}
      >
        <div className="px-4 py-3">
          {isCreating ? (
            <div className="flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter title..."
                className="flex-1 h-8 text-sm border-primary/50 focus:border-primary"
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleSave}
                className="h-8 w-8 p-0 bg-primary hover:bg-primary/90"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={handleStartCreating}
              disabled={isAnyColumnResizing}
              className={`
                w-full justify-start text-muted-foreground h-8 px-2 rounded-md transition-all duration-200
                ${!isAnyColumnResizing ? 'hover:text-foreground hover:bg-accent/30' : 'cursor-not-allowed'}
              `}
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          )}
        </div>
      </TableCell>

      {/* Empty Property Cells */}
      {fields.map((field) => (
        <TableCell 
          key={field.id} 
          className={`
            p-0 border-r border-border/20 last:border-r-0
            ${resizingFields.has(field.id) ? 'resize-active' : ''}
          `}
          style={{ 
            width: columnWidths[field.id] ? `${columnWidths[field.id]}px` : '200px',
            minWidth: '150px'
          }}
        >
          <div className="px-4 py-3">
            <div className="min-h-[24px] px-2 py-1 flex items-center">
              <span className="text-muted-foreground/40 text-sm">—</span>
            </div>
          </div>
        </TableCell>
      ))}

      {/* Empty Actions Cell */}
      <TableCell 
        className="w-16 p-3"
        style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}
      >
        <div className="w-8 h-8" />
      </TableCell>
    </TableRow>
  );
}
