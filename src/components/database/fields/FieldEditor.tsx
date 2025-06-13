
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DatabaseField } from '@/types/database';
import { SelectFieldEditor } from './SelectFieldEditor';
import { DateFieldEditor } from './DateFieldEditor';
import { EnhancedDateFieldEditor } from './EnhancedDateFieldEditor';
import { RelationFieldEditor } from './RelationFieldEditor';
import { PeopleFieldEditor } from '@/components/property/field-editors/PeopleFieldEditor';

interface FieldEditorProps {
  field: DatabaseField;
  value: string | null;
  onChange: (value: string) => void;
  workspaceId: string;
  pageId?: string;
}

export function FieldEditor({ field, value, onChange, workspaceId, pageId }: FieldEditorProps) {
  const [localValue, setLocalValue] = useState(value || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSavedValue, setLastSavedValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
    setLastSavedValue(value || '');
  }, [value]);

  const handleSave = async (newValue: string) => {
    if (newValue !== lastSavedValue) {
      console.log('FieldEditor: Saving value', { fieldId: field.id, value: newValue });
      setIsUpdating(true);
      
      try {
        setLastSavedValue(newValue);
        onChange(newValue);
        setTimeout(() => setIsUpdating(false), 300);
      } catch (error) {
        console.error('FieldEditor: Error saving value', error);
        setLastSavedValue(value || '');
        setLocalValue(value || '');
        setIsUpdating(false);
      }
    }
  };

  const handleBlur = () => {
    handleSave(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMultiline = field.type === 'text' && field.settings?.multiline;
    
    if (e.key === 'Enter' && !isMultiline) {
      e.preventDefault();
      handleSave(localValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLocalValue(lastSavedValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    console.log('FieldEditor: Local value changed', { fieldId: field.id, value: newValue });
  };

  const handleCheckboxChange = (checked: boolean) => {
    const newValue = checked ? 'true' : 'false';
    console.log('FieldEditor: Checkbox changed', { fieldId: field.id, value: newValue });
    setLocalValue(newValue);
    handleSave(newValue);
  };

  const handleSelectChange = (newValue: string) => {
    console.log('FieldEditor: Select changed', { fieldId: field.id, value: newValue });
    setLocalValue(newValue);
    handleSave(newValue);
  };

  const inputClassName = `
    border-none bg-transparent p-1 focus-visible:ring-1 focus-visible:ring-ring
    ${isUpdating ? 'opacity-60' : ''} 
    ${localValue !== lastSavedValue ? 'bg-accent/30 border-accent-foreground/20' : ''}
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
            disabled={isUpdating}
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
          disabled={isUpdating}
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
          disabled={isUpdating}
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
          disabled={isUpdating}
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
          disabled={isUpdating}
          autoFocus
        />
      );

    case 'checkbox':
      return (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={localValue === 'true'}
            onCheckedChange={handleCheckboxChange}
            disabled={isUpdating}
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
      // Check if enhanced features are enabled
      const hasEnhancedFeatures = field.settings?.enableRange || 
                                 field.settings?.enableNaturalLanguage || 
                                 field.settings?.enableReminders;
      
      if (hasEnhancedFeatures) {
        return (
          <EnhancedDateFieldEditor
            value={localValue}
            onChange={handleSelectChange}
            config={field.settings}
          />
        );
      }
      
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

    case 'people':
      return (
        <PeopleFieldEditor
          value={localValue}
          config={field.settings}
          onChange={handleSelectChange}
          field={field}
          workspaceId={workspaceId}
          pageId={pageId}
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
          disabled={isUpdating}
          autoFocus
        />
      );
  }
}
