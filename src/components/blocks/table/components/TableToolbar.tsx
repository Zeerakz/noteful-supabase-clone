
import React from 'react';
import { Plus, Trash2, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableToolbarProps {
  onAddRow: () => void;
  onAddColumn: () => void;
  onDelete: () => void;
}

export function TableToolbar({ onAddRow, onAddColumn, onDelete }: TableToolbarProps) {
  return (
    <div className="flex items-center justify-between p-2 border-b border-border bg-muted/25">
      <div className="flex items-center gap-1">
        <Table className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Table</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddRow}
          className="h-7 px-2"
        >
          <Plus className="h-3 w-3 mr-1" />
          Row
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddColumn}
          className="h-7 px-2"
        >
          <Plus className="h-3 w-3 mr-1" />
          Column
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-7 px-2 hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
