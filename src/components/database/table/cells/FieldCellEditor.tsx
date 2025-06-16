
import React from 'react';
import { DatabaseField } from '@/types/database';
import { FieldEditor } from '../../fields/FieldEditor';

interface FieldCellEditorProps {
  field: DatabaseField;
  value: string;
  onChange: (value: string) => void;
  workspaceId: string;
  pageId: string;
  pageData?: any;
  userProfiles?: any[];
  allFields?: DatabaseField[];
  computedValue?: string;
}

export function FieldCellEditor({
  field,
  value,
  onChange,
  workspaceId,
  pageId,
  pageData,
  userProfiles,
  allFields = [],
  computedValue
}: FieldCellEditorProps) {
  return (
    <FieldEditor
      field={field}
      value={value}
      onChange={onChange}
      workspaceId={workspaceId}
      pageId={pageId}
      pageData={pageData}
      userProfiles={userProfiles}
      allFields={allFields}
      computedValue={computedValue}
    />
  );
}
