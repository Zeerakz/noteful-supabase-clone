
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

  const handleSave = (newValue: string) => {
    console.log('FieldEditor: Saving value', { fieldId: field.id, value: newValue });
    onChange(newValue);
  };

  const handleBlur = () => {
    if (localValue !== (value || '')) {
      handleSave(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMultiline = field.type === 'text' && field.settings?.multiline;
    
    if (e.key === 'Enter' && !isMultiline) {
      e.preventDefault();
      handleSave(localValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLocalValue(value || '');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
  };

  const handleCheckboxChange = (checked: boolean) => {
    const newValue = checked ? 'true' : 'false';
    setLocalValue(newValue);
    handleSave(newValue);
  };

  const handleSelectChange = (newValue: string) => {
    setLocalValue(newValue);
    handleSave(newValue);
  };

  const inputClassName = `
    border-none bg-transparent p-1 focus-visible:ring-1 focus-visible:ring-ring
  `;

  switch (field.type) {
    case 'text':
      const isMultiline = field.settings?.multiline;
      
      if (isMultiline) {
        return (
          <Textarea
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={`Enter ${field.name.toLowerCase()}`}
            className={`${inputClassName} resize-none min-h-[60px]`}
            autoFocus
            rows={3}
          />
        );
      }
      
      return (
        <Input
          type="text"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={`Enter ${field.name.toLowerCase()}`}
          className={inputClassName}
          autoFocus
        />
      );

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
          className={inputClassName}
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
          className={inputClassName}
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
          className={inputClassName}
          autoFocus
        />
      );

    case 'checkbox':
      return (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={localValue === 'true'}
            onCheckedChange={handleCheckboxChange}
          />
        </div>
      );

    case 'select':
      return (
        <SelectFieldEditor
          value={localValue}
          settings={field.settings}
          onChange={handleSelectChange}
        />
      );

    case 'multi_select':
      return (
        <SelectFieldEditor
          value={localValue}
          settings={field.settings}
          onChange={handleSelectChange}
          multiSelect
        />
      );

    case 'date':
      return (
        <DateFieldEditor
          value={localValue}
          onChange={handleSelectChange}
        />
      );

    case 'relation':
      return (
        <RelationFieldEditor
          value={localValue}
          settings={field.settings}
          onChange={handleSelectChange}
          workspaceId={workspaceId}
        />
      );

    case 'formula':
    case 'rollup':
      return (
        <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded border border-border">
          <span className="text-sm text-muted-foreground italic">
            {localValue || 'Not calculated'} (Read-only)
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
          className={inputClassName}
          autoFocus
        />
      );
  }
}
