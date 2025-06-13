
import React from 'react';
import { DatabaseField } from '@/types/database';
import { propertyRegistry } from '@/types/propertyRegistry';
import { getFieldPropertyType } from '@/utils/fieldTypeMapper';
import { errorHandler, withErrorHandler } from '@/utils/errorHandler';

interface RegistryBasedFieldDisplayProps {
  field: DatabaseField;
  value: string | null;
  pageId?: string;
}

export function RegistryBasedFieldDisplay({ field, value, pageId }: RegistryBasedFieldDisplayProps) {
  console.log('🔍 RegistryBasedFieldDisplay rendering:', { 
    fieldType: field.type, 
    fieldName: field.name, 
    hasValue: !!value 
  });

  // Handle empty values consistently
  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const safeRender = withErrorHandler(() => {
    try {
      // Get the mapped property type
      const mappedType = getFieldPropertyType({ type: field.type, name: field.name });
      console.log('🗺️ Field type mapping:', { original: field.type, mapped: mappedType });
      
      // Try to get definition by mapped type first, then by original type
      let definition = propertyRegistry.get(mappedType);
      if (!definition) {
        console.log('⚠️ No definition found for mapped type, trying original type');
        definition = propertyRegistry.get(field.type as any);
      }
      
      if (!definition) {
        console.log('⚠️ No property definition found, using fallback display');
        return renderFallbackDisplay(field, value);
      }
      
      console.log('✅ Using property definition:', definition.type);
      const FieldDisplay = definition.FieldDisplay;
      
      return (
        <FieldDisplay
          value={value}
          config={field.settings || {}}
          field={field}
          pageId={pageId}
        />
      );
    } catch (error) {
      console.error('❌ Error in RegistryBasedFieldDisplay:', error);
      errorHandler.logError(error as Error, {
        context: 'registry_based_field_display',
        field: { type: field.type, name: field.name },
        value: value
      });
      return renderFallbackDisplay(field, value);
    }
  }, 'RegistryBasedFieldDisplay');

  return safeRender();
}

function renderFallbackDisplay(field: DatabaseField, value: string): React.ReactElement {
  console.log('🆘 Rendering fallback display for field:', field.type);
  
  // Enhanced fallback display based on field type
  if (field.type === 'date' || field.type.toLowerCase().includes('timestamp') ||
      field.type.toLowerCase().includes('date')) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return <span className="text-foreground">{date.toLocaleDateString()}</span>;
      }
    } catch {
      // Fall through to text display
    }
  }
  
  if (field.type === 'number' || field.type.toLowerCase().includes('int') ||
      field.type.toLowerCase().includes('num')) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return <span className="text-foreground font-mono">{num.toLocaleString()}</span>;
    }
  }
  
  if (field.type === 'checkbox') {
    const isChecked = value === 'true' || value === '1' || value === 'yes';
    return (
      <span className={`text-sm font-medium ${isChecked ? 'text-green-600' : 'text-gray-400'}`}>
        {isChecked ? '✓ Yes' : '✗ No'}
      </span>
    );
  }
  
  if (field.type === 'url') {
    try {
      new URL(value); // Validate URL
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {value}
        </a>
      );
    } catch {
      // Fall through to text display
    }
  }
  
  if (field.type === 'email') {
    return (
      <a 
        href={`mailto:${value}`}
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {value}
      </a>
    );
  }
  
  // Fallback to basic text display
  return <span className="text-foreground">{value}</span>;
}
