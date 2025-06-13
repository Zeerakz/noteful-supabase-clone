
import React, { useState, useMemo } from 'react';
import { TableCell } from '@/components/ui/table';
import { DatabaseField } from '@/types/database';
import { RegistryBasedFieldDisplay } from '@/components/database/fields/RegistryBasedFieldDisplay';
import { RegistryBasedFieldEditor } from '@/components/database/fields/RegistryBasedFieldEditor';
import { LazyRollupFieldDisplay } from '@/components/database/fields/LazyRollupFieldDisplay';

interface OptimizedPropertyTableCellProps {
  field: DatabaseField;
  value: string;
  pageId: string;
  workspaceId: string;
  width: number;
  onValueChange: (value: string) => void;
  isResizing?: boolean;
  allFields?: DatabaseField[];
  isVisible?: boolean;
  rowIndex?: number;
}

export function OptimizedPropertyTableCell({
  field,
  value,
  pageId,
  workspaceId,
  width,
  onValueChange,
  isResizing = false,
  allFields = [],
  isVisible = true,
  rowIndex = 0
}: OptimizedPropertyTableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  // Determine priority based on viewport position and field type
  const priority = useMemo(() => {
    if (field.type === 'rollup') {
      // Higher priority for visible rollups near the top
      if (rowIndex < 5) return 'high';
      if (rowIndex < 20) return 'normal';
      return 'low';
    }
    return 'normal';
  }, [field.type, rowIndex]);

  const handleStartEdit = () => {
    if (field.type === 'rollup') return; // Rollups are not editable
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

  // Use lazy rollup display for rollup fields
  const renderFieldContent = () => {
    if (field.type === 'rollup') {
      return (
        <LazyRollupFieldDisplay
          field={field}
          pageId={pageId}
          value={value}
          allFields={allFields}
          priority={priority}
          className="w-full"
        />
      );
    }

    if (isEditing) {
      return (
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
      );
    }

    return (
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
    );
  };

  return (
    <TableCell 
      className="p-2 border-r border-border/20" 
      style={{ width: `${width}px` }}
    >
      {renderFieldContent()}
    </TableCell>
  );
}
