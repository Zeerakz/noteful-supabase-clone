
import React from 'react';
import { DatabaseField } from '@/types/database';
import { propertyRegistry } from '@/types/propertyRegistry';

interface RegistryBasedFieldDisplayProps {
  field: DatabaseField;
  value: string | null;
  pageId?: string;
}

export function RegistryBasedFieldDisplay({ field, value, pageId }: RegistryBasedFieldDisplayProps) {
  // Handle empty values consistently
  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const definition = propertyRegistry.get(field.type as any);
  
  if (!definition) {
    // Fallback to basic text display
    return <span className="text-foreground">{value}</span>;
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
}
