
import React from 'react';
import { DatabaseField } from '@/types/database';
import { SelectFieldEditor } from './SelectFieldEditor';
import { DateFieldEditor } from './DateFieldEditor';
import { RelationFieldEditor } from './RelationFieldEditor';
import { SystemPropertyEditor } from '@/components/property/field-editors/SystemPropertyEditor';
import { isSystemProperty } from '@/types/systemProperties';

interface FieldEditorProps {
  field: DatabaseField;
  value: string;
  onChange: (value: string) => void;
  workspaceId: string;
  pageId: string;
  pageData?: any;
  userProfiles?: any[];
}

export function FieldEditor({ 
  field, 
  value, 
  onChange, 
  workspaceId, 
  pageId,
  pageData,
  userProfiles
}: FieldEditorProps) {
  // Handle system properties first - they are read-only
  if (isSystemProperty(field.type)) {
    return (
      <SystemPropertyEditor
        field={field}
        value={value}
        onChange={onChange}
        workspaceId={workspaceId}
        pageId={pageId}
        pageData={pageData}
        userProfiles={userProfiles}
      />
    );
  }

  switch (field.type) {
    case 'text':
    case 'number':
    case 'email':
    case 'phone':
    case 'url':
      return (
        <input
          type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
      );

    case 'checkbox':
      return (
        <input
          type="checkbox"
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          className="rounded"
        />
      );

    case 'select':
      return (
        <SelectFieldEditor
          value={value}
          onChange={onChange}
          settings={field.settings}
          workspaceId={workspaceId}
        />
      );

    case 'multi_select':
      return (
        <SelectFieldEditor
          value={value}
          onChange={onChange}
          settings={field.settings}
          workspaceId={workspaceId}
          multiSelect
        />
      );

    case 'date':
      return (
        <DateFieldEditor
          value={value}
          onChange={onChange}
        />
      );

    case 'relation':
      return (
        <RelationFieldEditor
          value={value}
          onChange={onChange}
          settings={field.settings}
          workspaceId={workspaceId}
        />
      );

    default:
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
      );
  }
}
