
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { DatabaseField } from '@/types/database';
import { SelectFieldEditor } from './SelectFieldEditor';
import { DateFieldEditor } from './DateFieldEditor';
import { RelationFieldEditor } from './RelationFieldEditor';

interface FieldEditorProps {
  field: DatabaseField;
  value: string | null;
  onChange: (value: string) => void;
  workspaceId: string;
  pageId?: string;
}

export function FieldEditor({ field, value, onChange, workspaceId, pageId }: FieldEditorProps) {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleBlur = () => {
    if (localValue !== (value || '')) {
      console.log('FieldEditor: Saving value on blur', { fieldId: field.id, value: localValue });
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      console.log('FieldEditor: Saving value on Enter', { fieldId: field.id, value: localValue });
      onChange(localValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLocalValue(value || '');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    console.log('FieldEditor: Local value changed', { fieldId: field.id, value: newValue });
  };

  const handleCheckboxChange = (checked: boolean) => {
    const newValue = checked ? 'true' : 'false';
    console.log('FieldEditor: Checkbox changed', { fieldId: field.id, value: newValue });
    onChange(newValue);
  };

  const handleSelectChange = (newValue: string) => {
    console.log('FieldEditor: Select changed', { fieldId: field.id, value: newValue });
    onChange(newValue);
  };

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <Input
          type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={`Enter ${field.name.toLowerCase()}`}
          className="border-none bg-transparent p-1 focus-visible:ring-1"
          autoFocus
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={`Enter ${field.name.toLowerCase()}`}
          className="border-none bg-transparent p-1 focus-visible:ring-1"
          autoFocus
        />
      );

    case 'url':
      return (
        <Input
          type="url"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com"
          className="border-none bg-transparent p-1 focus-visible:ring-1"
          autoFocus
        />
      );

    case 'checkbox':
      return (
        <Checkbox
          checked={value === 'true'}
          onCheckedChange={handleCheckboxChange}
        />
      );

    case 'select':
      return (
        <SelectFieldEditor
          value={value}
          settings={field.settings}
          onChange={handleSelectChange}
        />
      );

    case 'multi_select':
      return (
        <SelectFieldEditor
          value={value}
          settings={field.settings}
          onChange={handleSelectChange}
          multiSelect
        />
      );

    case 'date':
      return (
        <DateFieldEditor
          value={value}
          onChange={handleSelectChange}
        />
      );

    case 'relation':
      return (
        <RelationFieldEditor
          value={value}
          settings={field.settings}
          onChange={handleSelectChange}
          workspaceId={workspaceId}
        />
      );

    case 'formula':
    case 'rollup':
      // Computed fields are read-only, show current value
      return (
        <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded border">
          <span className="text-sm text-muted-foreground italic">
            {value || 'Not calculated'} (Read-only)
          </span>
        </div>
      );

    default:
      return (
        <Input
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={`Enter ${field.name.toLowerCase()}`}
          className="border-none bg-transparent p-1 focus-visible:ring-1"
          autoFocus
        />
      );
  }
}
