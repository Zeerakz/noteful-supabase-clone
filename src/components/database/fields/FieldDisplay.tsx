
import React from 'react';
import { DatabaseField } from '@/types/database';
import { propertyRegistry } from '@/types/propertyRegistry';
import { getFieldPropertyType } from '@/utils/fieldTypeMapper';
import { SystemPropertyDisplay } from '@/components/property/field-displays/SystemPropertyDisplay';
import { isSystemProperty } from '@/types/systemProperties';
import { ButtonFieldDisplay } from '@/components/property/field-displays/ButtonFieldDisplay';

interface FieldDisplayProps {
  field: DatabaseField;
  value: string | null;
  pageId?: string;
  pageData?: any;
  userProfiles?: any[];
  onValueChange?: (value: string) => void;
}

export function FieldDisplay({ 
  field, 
  value, 
  pageId, 
  pageData,
  userProfiles,
  onValueChange 
}: FieldDisplayProps) {
  // Handle system properties first as they have special display logic
  if (isSystemProperty(field.type)) {
    return (
      <SystemPropertyDisplay
        field={field}
        value={value}
        pageId={pageId}
        pageData={pageData}
        userProfiles={userProfiles}
      />
    );
  }

  // Handle button fields
  if (field.type === 'button') {
    return (
      <ButtonFieldDisplay
        value={value}
        config={field.settings || {}}
        field={field}
        pageId={pageId}
      />
    );
  }

  const propertyType = getFieldPropertyType(field);
  const definition = propertyRegistry.get(propertyType);

  if (!definition) {
    return <span className="text-foreground">{value ?? '—'}</span>;
  }
  
  const config = field.settings || definition.getDefaultConfig();
  const DisplayComponent = definition.FieldDisplay;

  if (value === null || value === undefined || value.trim() === '') {
    // Some components might render even with empty values (e.g. checkbox)
    if (DisplayComponent && definition.rendersEmpty) {
       return <DisplayComponent value={value} config={config} field={field} pageId={pageId} onValueChange={onValueChange} inTable={false} />;
    }
    return <span className="text-muted-foreground">—</span>;
  }

  if (!DisplayComponent) {
    return <span className="text-foreground">{value}</span>;
  }

  return (
    <DisplayComponent 
      value={value}
      config={config}
      inTable={false}
      field={field}
      pageId={pageId}
      onValueChange={onValueChange}
    />
  );
}
