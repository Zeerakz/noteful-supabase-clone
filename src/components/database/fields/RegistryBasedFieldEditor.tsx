
import React from 'react';
import { DatabaseField } from '@/types/database';
import { propertyRegistry } from '@/types/propertyRegistry';

interface RegistryBasedFieldEditorProps {
  field: DatabaseField;
  value: string | null;
  onChange: (value: string) => void;
  workspaceId: string;
  pageId?: string;
}

export function RegistryBasedFieldEditor({ 
  field, 
  value, 
  onChange, 
  workspaceId, 
  pageId 
}: RegistryBasedFieldEditorProps) {
  const definition = propertyRegistry.get(field.type as any);
  
  if (!definition) {
    // Fallback to basic text input
    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-1 border rounded"
        placeholder={`Enter ${field.name.toLowerCase()}`}
      />
    );
  }
  
  const FieldEditor = definition.FieldEditor;
  
  return (
    <FieldEditor
      value={value}
      config={field.settings || {}}
      onChange={onChange}
      field={field}
      workspaceId={workspaceId}
      pageId={pageId}
    />
  );
}
