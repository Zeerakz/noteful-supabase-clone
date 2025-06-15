import React, { useState, useMemo } from 'react';
import { TableCell } from '@/components/ui/table';
import { DatabaseField } from '@/types/database';
import { RegistryBasedFieldDisplay } from '@/components/database/fields/RegistryBasedFieldDisplay';
import { RegistryBasedFieldEditor } from '@/components/database/fields/RegistryBasedFieldEditor';
import { LazyRollupFieldDisplay } from '@/components/database/fields/LazyRollupFieldDisplay';
import { propertyRegistry } from '@/types/propertyRegistry';
import { getFieldPropertyType } from '@/utils/fieldTypeMapper';

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

  // Check if field is editable
  const isFieldEditable = useMemo(() => {
    const mappedType = getFieldPropertyType(field);
    const definition = propertyRegistry.get(mappedType) || propertyRegistry.get(field.type as any);
    if (definition?.isComputed) {
      return false;
    }
    
    // System properties and computed fields are not editable
    const readOnlyTypes = ['rollup', 'formula', 'created_time', 'created_by', 'last_edited_time', 'last_edited_by', 'id'];
    return !readOnlyTypes.includes(field.type);
  }, [field.type, field.name]);

  const handleStartEdit = () => {
    if (!isFieldEditable) {
      console.log(`Field ${field.name} (${field.type}) is not editable`);
      return;
    }
    
    console.log(`Starting edit for field: ${field.name} (${field.type}), current value:`, value);
    setIsEditing(true);
    setEditValue(value || '');
  };

  const handleSaveEdit = () => {
    console.log(`Saving edit for field: ${field.name}, new value:`, editValue);
    onValueChange(editValue);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    console.log(`Cancelling edit for field: ${field.name}`);
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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

    if (isEditing && isFieldEditable) {
      return (
        <div onKeyDown={handleKeyDown} className="w-full">
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
              className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded hover:bg-muted/90"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`
          min-h-[24px] p-1 rounded transition-all duration-150
          ${isFieldEditable ? 'cursor-text hover:bg-muted/50' : 'cursor-default'}
          ${isResizing ? 'opacity-60' : ''}
        `}
        onClick={isFieldEditable ? handleStartEdit : undefined}
        title={isFieldEditable ? `Click to edit ${field.name}` : `${field.name} (read-only)`}
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
