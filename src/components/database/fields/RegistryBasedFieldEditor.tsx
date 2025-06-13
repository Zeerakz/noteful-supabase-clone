
import React from 'react';
import { DatabaseField } from '@/types/database';
import { propertyRegistry } from '@/types/propertyRegistry';
import { getFieldPropertyType } from '@/utils/fieldTypeMapper';
import { errorHandler, withErrorHandler } from '@/utils/errorHandler';

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
  console.log('✏️ RegistryBasedFieldEditor rendering:', { 
    fieldType: field.type, 
    fieldName: field.name,
    hasValue: !!value 
  });

  const safeRender = withErrorHandler(() => {
    try {
      // Get the mapped property type
      const mappedType = getFieldPropertyType({ type: field.type, name: field.name });
      console.log('🗺️ Field type mapping for editor:', { original: field.type, mapped: mappedType });
      
      // Try to get definition by mapped type first, then by original type
      let definition = propertyRegistry.get(mappedType);
      if (!definition) {
        console.log('⚠️ No definition found for mapped type, trying original type');
        definition = propertyRegistry.get(field.type as any);
      }
      
      if (!definition) {
        console.log('⚠️ No property definition found, using fallback editor');
        return renderFallbackEditor(field, value || '', onChange);
      }
      
      console.log('✅ Using property definition for editor:', definition.type);
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
    } catch (error) {
      console.error('❌ Error in RegistryBasedFieldEditor:', error);
      errorHandler.logError(error as Error, {
        context: 'registry_based_field_editor',
        field: { type: field.type, name: field.name },
        value: value
      });
      return renderFallbackEditor(field, value || '', onChange);
    }
  }, 'RegistryBasedFieldEditor');

  return safeRender();
}

function renderFallbackEditor(
  field: DatabaseField, 
  value: string, 
  onChange: (value: string) => void
): React.ReactElement {
  console.log('🆘 Rendering fallback editor for field:', field.type);
  
  // Enhanced fallback based on field type
  if (field.type === 'date' || field.type.toLowerCase().includes('timestamp') ||
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
  
  if (field.type === 'number' || field.type.toLowerCase().includes('int') ||
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
  
  if (field.type === 'email') {
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
  
  if (field.type === 'url') {
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
  
  if (field.type === 'checkbox') {
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
