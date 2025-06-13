
import React from 'react';
import { DatabaseField } from '@/types/database';
import { SelectFieldEditor } from './SelectFieldEditor';
import { DateFieldEditor } from './DateFieldEditor';
import { RelationFieldEditor } from './RelationFieldEditor';
import { RollupFieldDisplay } from './RollupFieldDisplay';
import { SystemPropertyEditor } from '@/components/property/field-editors/SystemPropertyEditor';
import { ButtonFieldEditor } from '@/components/property/field-editors/ButtonFieldEditor';
import { isSystemProperty } from '@/types/systemProperties';

interface FieldEditorProps {
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

export function FieldEditor({ 
  field, 
  value, 
  onChange, 
  workspaceId, 
  pageId,
  pageData,
  userProfiles,
  allFields = [],
  computedValue
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

  // Handle rollup fields - they are computed and read-only
  if (field.type === 'rollup') {
    return (
      <RollupFieldDisplay
        field={field}
        pageId={pageId}
        value={value}
        computedValue={computedValue}
        allFields={allFields}
      />
    );
  }

  // Handle formula fields - they are computed and read-only
  if (field.type === 'formula') {
    return (
      <div className="text-sm text-muted-foreground italic">
        {computedValue || 'Formula not calculated'}
      </div>
    );
  }

  // Handle button fields
  if (field.type === 'button') {
    return (
      <ButtonFieldEditor
        value={value}
        config={field.settings || {}}
        onChange={onChange}
        field={field}
        workspaceId={workspaceId}
        pageId={pageId}
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
        />
      );

    case 'multi_select':
      return (
        <SelectFieldEditor
          value={value}
          onChange={onChange}
          settings={field.settings}
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
      const handleRelationChange = (newValue: string | string[] | null) => {
        if (newValue === null) {
          onChange('');
        } else if (Array.isArray(newValue)) {
          onChange(newValue.join(','));
        } else {
          onChange(newValue);
        }
      };

      const relationValue = value ? (
        field.settings?.allowMultiple ? value.split(',').filter(Boolean) : value
      ) : null;

      return (
        <RelationFieldEditor
          value={relationValue}
          onChange={handleRelationChange}
          settings={field.settings}
          workspaceId={workspaceId}
          isMultiple={field.settings?.allowMultiple || false}
          showBacklink={field.settings?.bidirectional || false}
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
