
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
        group border-b border-border transition-colors duration-150
        hover:bg-accent/10 
        ${isEvenRow ? 'bg-muted/5' : 'bg-background'}
        ${isCreating ? 'bg-accent/10 border-accent/30' : ''}
      `}
    >
      {/* Empty checkbox cell */}
      <TableCell className="w-[50px] p-0 border-r border-border/50">
        <div className="flex items-center justify-center h-12 px-3">
          <div className="w-4 h-4" />
        </div>
      </TableCell>

      {/* Title Cell */}
      <TableCell 
        className="p-0 border-r border-border/50"
        style={{ width: columnWidths['title'] ? `${columnWidths['title']}px` : '250px' }}
      >
        <div className="h-12 px-3 flex items-center">
          {isCreating ? (
            <div className="flex items-center gap-2 w-full">
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
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/30 h-8 px-2 rounded-md transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          )}
        </div>
      </TableCell>

      {/* Empty Property Cells */}
      {fields.map((field, index) => (
        <TableCell 
          key={field.id} 
          className={`p-0 ${index < fields.length - 1 ? 'border-r border-border/50' : ''}`}
          style={{ width: columnWidths[field.id] ? `${columnWidths[field.id]}px` : '180px' }}
        >
          <div className="h-12 px-3 flex items-center">
            <div className="min-h-[24px] px-2 py-1 flex items-center w-full">
              <span className="text-muted-foreground/40 text-sm">—</span>
            </div>
          </div>
        </TableCell>
      ))}

      {/* Empty Actions Cell */}
      <TableCell className="w-[60px] p-0">
        <div className="h-12 px-3 flex items-center justify-center">
          <div className="w-8 h-8" />
        </div>
      </TableCell>
    </TableRow>
  );
}
