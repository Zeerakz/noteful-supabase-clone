
import React from 'react';
import { ButtonPropertyConfig } from '@/types/property/configs/button';
import { ButtonBasicConfig } from './button/ButtonBasicConfig';
import { ActionListEditor } from './button/ActionListEditor';

interface ButtonPropertyConfigEditorProps {
  config: ButtonPropertyConfig;
  onConfigChange: (config: ButtonPropertyConfig) => void;
  workspaceId?: string;
  currentDatabaseId?: string;
}

export function ButtonPropertyConfigEditor({
  config,
  onConfigChange,
  workspaceId,
  currentDatabaseId
}: ButtonPropertyConfigEditorProps) {

  const updateConfig = (updates: Partial<ButtonPropertyConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      <ButtonBasicConfig config={config} onConfigChange={updateConfig} />
      <ActionListEditor 
        config={config} 
        onConfigChange={updateConfig} 
        workspaceId={workspaceId}
        currentDatabaseId={currentDatabaseId}
      />
    </div>
  );
}
