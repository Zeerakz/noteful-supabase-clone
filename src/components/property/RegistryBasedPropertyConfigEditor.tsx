
import React from 'react';
import { Property, PropertyType, PropertyConfig } from '@/types/property';
import { propertyRegistry } from '@/types/propertyRegistry';
import { GentleError } from '@/components/ui/gentle-error';

interface RegistryBasedPropertyConfigEditorProps {
  propertyType: PropertyType;
  config: PropertyConfig;
  onConfigChange: (config: PropertyConfig) => void;
  workspaceId?: string;
  availableProperties?: Property[];
  currentDatabaseId?: string; // Added prop
}

export function RegistryBasedPropertyConfigEditor({
  propertyType,
  config,
  onConfigChange,
  workspaceId,
  availableProperties = [],
  currentDatabaseId // Added prop
}: RegistryBasedPropertyConfigEditorProps) {
  const definition = propertyRegistry.get(propertyType);
  
  if (!definition) {
    return (
      <GentleError 
        message={`Unknown property type: ${propertyType}`}
        suggestion="This property type may not be registered correctly."
      />
    );
  }
  
  const ConfigEditor = definition.ConfigEditor as any;
  
  return (
    <div className="space-y-4">
      <ConfigEditor
        config={config}
        onConfigChange={onConfigChange}
        workspaceId={workspaceId}
        availableProperties={availableProperties}
        currentDatabaseId={currentDatabaseId} // Pass down
      />
    </div>
  );
}
