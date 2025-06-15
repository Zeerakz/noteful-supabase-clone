
import React from 'react';
import { FieldType, FormulaFieldSettings, RollupFieldSettings, RelationFieldSettings, SelectFieldSettings, DatabaseField } from '@/types/database';
import { FormulaFieldConfig } from './FormulaFieldConfig';
import { RollupFieldConfig } from './RollupFieldConfig';
import { RelationFieldConfig } from './RelationFieldConfig';
import { SelectFieldConfig } from './SelectFieldConfig';
import { NumberPropertyConfigEditor } from '@/components/property/config-editors/NumberPropertyConfigEditor';
import { NumberPropertyConfig, StatusPropertyConfig } from '@/types/property';
import { AiAutofillPropertyConfig } from '@/types/property/configs/aiAutofill';
import { AiAutofillPropertyConfigEditor } from '@/components/property/config-editors/AiAutofillPropertyConfigEditor';
import { StatusPropertyConfigEditor } from '@/components/property/config-editors/StatusPropertyConfigEditor';

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
      
      case 'select':
      case 'multi_select':
        return (
          <SelectFieldConfig
            settings={settings as SelectFieldSettings}
            onSettingsChange={onSettingsChange}
          />
        );
      
      case 'status':
        return (
          <StatusPropertyConfigEditor
            config={settings as StatusPropertyConfig}
            onConfigChange={onSettingsChange}
          />
        );

      case 'number':
        return (
          <NumberPropertyConfigEditor
            config={settings as NumberPropertyConfig}
            onConfigChange={onSettingsChange}
          />
        );

      case 'ai_autofill':
        return (
          <AiAutofillPropertyConfigEditor
            config={settings as AiAutofillPropertyConfig}
            onConfigChange={onSettingsChange}
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
