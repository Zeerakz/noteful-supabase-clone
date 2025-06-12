
import React from 'react';
import { Property, PropertyType, PropertyConfig } from '@/types/property';
import { propertyRegistry } from '@/types/propertyRegistry';

interface RegistryBasedPropertyConfigEditorProps {
  propertyType: PropertyType;
  config: PropertyConfig;
  onConfigChange: (config: PropertyConfig) => void;
  workspaceId?: string;
  availableProperties?: Property[];
}

export function RegistryBasedPropertyConfigEditor({
  propertyType,
  config,
  onConfigChange,
  workspaceId,
  availableProperties = []
}: RegistryBasedPropertyConfigEditorProps) {
  const definition = propertyRegistry.get(propertyType);
  
  if (!definition) {
    return (
      <div className="text-sm text-muted-foreground">
        Unknown property type: {propertyType}
      </div>
    );
  }
  
  const ConfigEditor = definition.ConfigEditor;
  
  return (
    <div className="space-y-4">
      <ConfigEditor
        config={config}
        onConfigChange={onConfigChange}
        workspaceId={workspaceId}
        availableProperties={availableProperties}
      />
    </div>
  );
}
