
import React from 'react';
import { DatabaseField } from '@/types/database';
import { propertyRegistry } from '@/types/propertyRegistry';
import { getFieldPropertyType } from '@/utils/fieldTypeMapper';
import { errorHandler } from '@/utils/errorHandler';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

interface RegistryBasedFieldDisplayProps {
  field: DatabaseField;
  value: string | null;
  pageId?: string;
}

export function RegistryBasedFieldDisplay({ field, value, pageId }: RegistryBasedFieldDisplayProps) {
  const renderContent = () => {
    // Handle empty values consistently
    if (value === null || value === undefined || value.trim() === '') {
      return <span className="text-muted-foreground">—</span>;
    }

    const mappedType = getFieldPropertyType(field);
    let definition = propertyRegistry.get(mappedType) || propertyRegistry.get(field.type as any);

    if (!definition || !propertyRegistry.has(definition.type)) {
      errorHandler.logError(new Error(`No property definition for type: ${field.type}`), {
        context: 'RegistryBasedFieldDisplay',
        field,
        mappedType,
      });
      definition = propertyRegistry.get('unsupported');
    }

    if (!definition) {
      // This should ideally never happen if 'unsupported' is registered
      return <span className="text-destructive">Registry Error</span>;
    }

    const FieldDisplay = definition.FieldDisplay;

    return (
      <FieldDisplay
        value={value}
        config={field.settings || {}}
        field={field}
        pageId={pageId}
      />
    );
  };

  return (
    <ErrorBoundary
      context="RegistryBasedFieldDisplay"
      fallback={
        <div className="text-xs text-destructive p-1 bg-destructive/10 rounded">
          Display Error
        </div>
      }
    >
      {renderContent()}
    </ErrorBoundary>
  );
}
