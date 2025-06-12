
import React from 'react';
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
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <Input
          type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.name.toLowerCase()}`}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.name.toLowerCase()}`}
        />
      );

    case 'url':
      return (
        <Input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com"
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
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.name.toLowerCase()}`}
        />
      );
  }
}
