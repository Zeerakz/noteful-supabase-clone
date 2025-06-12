
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
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onChange(localValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLocalValue(value || '');
    }
  };

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <Input
          type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
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
          onChange={(e) => setLocalValue(e.target.value)}
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
          onChange={(e) => setLocalValue(e.target.value)}
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
          onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
        />
      );

    case 'select':
      return (
        <SelectFieldEditor
          value={value}
          settings={field.settings}
          onChange={onChange}
        />
      );

    case 'multi_select':
      return (
        <SelectFieldEditor
          value={value}
          settings={field.settings}
          onChange={onChange}
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
          settings={field.settings}
          onChange={onChange}
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
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={`Enter ${field.name.toLowerCase()}`}
          className="border-none bg-transparent p-1 focus-visible:ring-1"
          autoFocus
        />
      );
  }
}
