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
}

export function NewTableRow({
  fields,
  onCreateRow,
  columnWidths = {},
  isEvenRow = false
}: NewTableRowProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');

  const handleStartCreating = () => {
    setIsCreating(true);
    setTitle('');
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
        group border-b border-border/40 transition-colors duration-150
        hover:bg-muted/30
        ${isEvenRow ? 'bg-muted/20' : 'bg-background'}
        ${isCreating ? 'bg-primary/5' : ''}
      `}
    >
      {/* Empty checkbox cell */}
      <TableCell className="w-[48px] p-2">
        <div className="flex items-center justify-center">
          <div className="w-4 h-4" /> {/* Spacer to align with checkbox column */}
        </div>
      </TableCell>

      {/* Title Cell */}
      <TableCell 
        className="sticky left-[48px] bg-inherit border-r w-[200px] z-10"
        style={{ width: columnWidths['title'] ? `${columnWidths['title']}px` : '200px' }}
      >
        {isCreating ? (
          <div className="flex items-center gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter title..."
              className="flex-1 h-8 text-sm"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleSave}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={handleStartCreating}
            className="w-full justify-start text-muted-foreground hover:text-foreground h-8 px-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        )}
      </TableCell>

      {/* Empty Property Cells */}
      {fields.map((field) => (
        <TableCell 
          key={field.id} 
          className="min-w-[150px] p-1"
          style={{ width: columnWidths[field.id] ? `${columnWidths[field.id]}px` : undefined }}
        >
          <div className="min-h-[32px] px-2 py-1 flex items-center">
            <span className="text-muted-foreground/50 text-sm">—</span>
          </div>
        </TableCell>
      ))}

      {/* Empty Actions Cell */}
      <TableCell className="w-[60px] p-2">
        <div className="w-8 h-8" /> {/* Spacer */}
      </TableCell>
    </TableRow>
  );
}
