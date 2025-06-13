
import React from 'react';
import { DatePropertyConfig } from '@/types/property';
import { EnhancedDatePropertyConfigEditor } from './EnhancedDatePropertyConfigEditor';

interface DatePropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: DatePropertyConfig) => void;
  includeTime?: boolean;
}

export function DatePropertyConfigEditor({ config, onConfigChange, includeTime = false }: DatePropertyConfigEditorProps) {
  const dateConfig = config as DatePropertyConfig;

  return (
    <EnhancedDatePropertyConfigEditor
      config={dateConfig}
      onConfigChange={onConfigChange}
      includeTime={includeTime}
    />
  );
}
