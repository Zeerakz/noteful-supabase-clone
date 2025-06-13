
import React, { useState } from 'react';
import { TableCell } from '@/components/ui/table';
import { DatabaseField } from '@/types/database';
import { RegistryBasedFieldDisplay } from '@/components/database/fields/RegistryBasedFieldDisplay';
import { RegistryBasedFieldEditor } from '@/components/database/fields/RegistryBasedFieldEditor';

interface PropertyTableCellProps {
  field: DatabaseField;
  value: string;
  pageId: string;
  workspaceId: string;
  width: number;
  onValueChange: (value: string) => void;
  isResizing?: boolean;
}

export function PropertyTableCell({
  field,
  value,
  pageId,
  workspaceId,
  width,
  onValueChange,
  isResizing = false
}: PropertyTableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(value || '');
  };

  const handleSaveEdit = () => {
    onValueChange(editValue);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  return (
    <TableCell 
      className="p-2 border-r border-border/20" 
      style={{ width: `${width}px` }}
    >
      {isEditing ? (
        <div onKeyDown={handleKeyDown}>
          <RegistryBasedFieldEditor
            field={field}
            value={editValue}
            onChange={setEditValue}
            workspaceId={workspaceId}
            pageId={pageId}
          />
          <div className="flex gap-1 mt-1">
            <button
              onClick={handleSaveEdit}
              className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`cursor-text hover:bg-muted/50 p-1 rounded min-h-[24px] transition-opacity duration-150 ${
            isResizing ? 'opacity-60' : ''
          }`}
          onClick={handleStartEdit}
        >
          <RegistryBasedFieldDisplay
            field={field}
            value={value}
            pageId={pageId}
          />
        </div>
      )}
    </TableCell>
  );
}
