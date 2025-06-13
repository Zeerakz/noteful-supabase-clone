
import React from 'react';
import { RollupFieldSettings, DatabaseField } from '@/types/database';
import { EnhancedRollupFieldConfig } from './EnhancedRollupFieldConfig';

interface RollupFieldConfigProps {
  settings: RollupFieldSettings;
  onSettingsChange: (settings: RollupFieldSettings) => void;
  availableFields: DatabaseField[];
  workspaceId: string;
}

export function RollupFieldConfig({ settings, onSettingsChange, availableFields, workspaceId }: RollupFieldConfigProps) {
  return (
    <EnhancedRollupFieldConfig
      settings={settings}
      onSettingsChange={onSettingsChange}
      availableFields={availableFields}
      workspaceId={workspaceId}
    />
  );
}
