
import React from 'react';
import { FieldType, FormulaFieldSettings, RollupFieldSettings, RelationFieldSettings, DatabaseField } from '@/types/database';
import { FormulaFieldConfig } from './FormulaFieldConfig';
import { RollupFieldConfig } from './RollupFieldConfig';
import { RelationFieldConfig } from './RelationFieldConfig';

interface FieldConfigurationPanelProps {
  fieldType: FieldType;
  settings: any;
  onSettingsChange: (settings: any) => void;
  availableFields: DatabaseField[];
  workspaceId: string;
}

export function FieldConfigurationPanel({ 
  fieldType, 
  settings, 
  onSettingsChange, 
  availableFields, 
  workspaceId 
}: FieldConfigurationPanelProps) {
  const renderConfiguration = () => {
    switch (fieldType) {
      case 'formula':
        return (
          <FormulaFieldConfig
            settings={settings as FormulaFieldSettings}
            onSettingsChange={onSettingsChange}
            availableFields={availableFields}
          />
        );
      
      case 'rollup':
        return (
          <RollupFieldConfig
            settings={settings as RollupFieldSettings}
            onSettingsChange={onSettingsChange}
            availableFields={availableFields}
            workspaceId={workspaceId}
          />
        );
      
      case 'relation':
        return (
          <RelationFieldConfig
            settings={settings as RelationFieldSettings}
            onSettingsChange={onSettingsChange}
            workspaceId={workspaceId}
          />
        );
      
      default:
        return null;
    }
  };

  const configuration = renderConfiguration();
  
  if (!configuration) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      <h4 className="text-sm font-medium">Field Configuration</h4>
      {configuration}
    </div>
  );
}
