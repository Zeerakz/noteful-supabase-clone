
import React from 'react';
import { DatabaseField } from '@/types/database';
import { propertyRegistry } from '@/types/propertyRegistry';
import { getFieldPropertyType } from '@/utils/fieldTypeMapper';

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
  // Get the mapped property type
  const mappedType = getFieldPropertyType({ type: field.type, name: field.name });
  
  // Try to get definition by mapped type first, then by original type
  let definition = propertyRegistry.get(mappedType);
  if (!definition) {
    definition = propertyRegistry.get(field.type as any);
  }
  
  if (!definition) {
    console.warn(`No property definition found for field type: ${field.type} (mapped to: ${mappedType})`);
    
    // Enhanced fallback based on field type
    if (field.type === 'date' || mappedType === 'date' || 
        field.type.toLowerCase().includes('timestamp') ||
        field.type.toLowerCase().includes('date')) {
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={`Enter ${field.name.toLowerCase()}`}
        />
      );
    }
    
    if (field.type === 'number' || mappedType === 'number' ||
        field.type.toLowerCase().includes('int') ||
        field.type.toLowerCase().includes('num')) {
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={`Enter ${field.name.toLowerCase()}`}
        />
      );
    }
    
    if (field.type === 'email' || mappedType === 'email') {
      return (
        <input
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={`Enter ${field.name.toLowerCase()}`}
        />
      );
    }
    
    if (field.type === 'url' || mappedType === 'url') {
      return (
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={`Enter ${field.name.toLowerCase()}`}
        />
      );
    }
    
    if (field.type === 'checkbox' || mappedType === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={value === 'true' || value === '1'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          className="rounded"
        />
      );
    }
    
    // Default text fallback with better styling
    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
