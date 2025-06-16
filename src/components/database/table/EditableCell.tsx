
import React from 'react';
import { cn } from '@/lib/utils';
import { DatabaseField } from '@/types/database';
import { CellContainer } from './cells/CellContainer';
import { BasicTextEditor } from './cells/BasicTextEditor';
import { FieldCellEditor } from './cells/FieldCellEditor';
import { useCellEditing } from './cells/useCellEditing';

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  // New props for field type support
  field?: DatabaseField;
  workspaceId?: string;
  pageId?: string;
  pageData?: any;
  userProfiles?: any[];
  allFields?: DatabaseField[];
  computedValue?: string;
}

export function EditableCell({
  value,
  onChange,
  className,
  placeholder = "Empty",
  disabled = false,
  multiline = false,
  onBlur,
  onFocus,
  field,
  workspaceId,
  pageId,
  pageData,
  userProfiles,
  allFields = [],
  computedValue
}: EditableCellProps) {
  const {
    isEditing,
    localValue,
    setLocalValue,
    containerRef,
    handleClick,
    handleKeyDown,
    handleBlur,
    handleFocus
  } = useCellEditing({
    value,
    onSave: onChange,
    onBlur,
    onFocus,
    multiline
  });

  if (!isEditing) {
    return (
      <CellContainer
        isEditing={false}
        onClick={disabled ? undefined : handleClick}
        className={className}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
      />
    );
  }

  return (
    <div ref={containerRef}>
      <CellContainer
        isEditing={true}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={className}
      >
        {/* If it's a field with specific type, use FieldCellEditor */}
        {field && workspaceId && pageId ? (
          <FieldCellEditor
            field={field}
            value={localValue}
            onChange={setLocalValue}
            workspaceId={workspaceId}
            pageId={pageId}
            pageData={pageData}
            userProfiles={userProfiles}
            allFields={allFields}
            computedValue={computedValue}
          />
        ) : (
          /* For simple text/title fields, use BasicTextEditor */
          <BasicTextEditor
            value={localValue}
            onChange={setLocalValue}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className={className}
            multiline={multiline}
          />
        )}
      </CellContainer>
    </div>
  );
}
