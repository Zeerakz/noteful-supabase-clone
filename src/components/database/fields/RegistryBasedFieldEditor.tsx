
import React from 'react';
import { DatabaseField } from '@/types/database';
import { propertyRegistry } from '@/types/propertyRegistry';
import { getFieldPropertyType } from '@/utils/fieldTypeMapper';
import { errorHandler } from '@/utils/errorHandler';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

interface RegistryBasedFieldEditorProps {
  field: DatabaseField;
  value: string | null;
  onChange: (value: any) => void;
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
  
  const renderContent = () => {
    const mappedType = getFieldPropertyType(field);
    let definition = propertyRegistry.get(mappedType) || propertyRegistry.get(field.type as any);

    if (!definition || !propertyRegistry.has(definition.type)) {
      errorHandler.logError(new Error(`No property definition for type: ${field.type}`), {
        context: 'RegistryBasedFieldEditor',
        field,
        mappedType,
      });
      definition = propertyRegistry.get('unsupported');
    }

    if (!definition) {
      return <div className="text-destructive">Registry Error</div>;
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
  };

  return (
    <ErrorBoundary
      context="RegistryBasedFieldEditor"
      fallback={
        <div className="text-xs text-destructive p-1 bg-destructive/10 rounded">
          Editor Error
        </div>
      }
    >
      {renderContent()}
    </ErrorBoundary>
  );
}
