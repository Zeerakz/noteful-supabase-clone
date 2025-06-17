
import React from 'react';
import { DatabaseField } from '@/types/database';
import { SelectFieldEditor } from './SelectFieldEditor';
import { DateFieldEditor } from './DateFieldEditor';
import { RelationFieldEditor } from './RelationFieldEditor';
import { RollupFieldDisplay } from './RollupFieldDisplay';
import { SystemPropertyEditor } from '@/components/property/field-editors/SystemPropertyEditor';
import { ButtonFieldEditor } from '@/components/property/field-editors/ButtonFieldEditor';
import { isSystemProperty } from '@/types/systemProperties';
import { StatusFieldEditor } from '@/components/property/field-editors/StatusFieldEditor';
import { BasicInputFieldEditor } from './editors/BasicInputFieldEditor';
import { CheckboxFieldEditor } from './editors/CheckboxFieldEditor';
import { PeopleFieldEditor } from './editors/PeopleFieldEditor';
import { FormulaFieldDisplay } from './editors/FormulaFieldDisplay';
import { AiAutofillFieldEditor } from '@/components/property/field-editors/AiAutofillFieldEditor';

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
    return <FormulaFieldDisplay computedValue={computedValue} />;
  }
  
  if (field.type === 'ai_autofill') {
    return (
      <AiAutofillFieldEditor
        value={value}
        config={field.settings || {}}
        onChange={onChange}
        pageId={pageId}
      />
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
      return <BasicInputFieldEditor type={field.type} value={value} onChange={onChange} />;

    case 'checkbox':
      return <CheckboxFieldEditor value={value} onChange={onChange} />;
    
    case 'status':
      return (
        <StatusFieldEditor
          value={value}
          onChange={onChange}
          config={field.settings}
          field={field}
          workspaceId={workspaceId}
          pageId={pageId}
        />
      );

    case 'people':
      return <PeopleFieldEditor value={value} onChange={onChange} />;

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
      return <DateFieldEditor value={value} onChange={onChange} />;

    case 'relation':
      return (
        <RelationFieldEditor
          field={field}
          pageId={pageId}
          value={value}
          onValueChange={onChange}
          workspaceId={workspaceId}
        />
      );

    default:
      return <BasicInputFieldEditor type="text" value={value} onChange={onChange} />;
  }
}
