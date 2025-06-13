
import React from 'react';
import { ButtonPropertyConfig } from '@/types/property/configs/button';
import { ButtonFieldDisplay } from '../field-displays/ButtonFieldDisplay';

interface ButtonFieldEditorProps {
  value: any;
  config: ButtonPropertyConfig;
  onChange: (value: any) => void;
  field?: any;
  workspaceId?: string;
  pageId?: string;
}

export function ButtonFieldEditor({ 
  value, 
  config, 
  onChange, 
  field, 
  workspaceId, 
  pageId 
}: ButtonFieldEditorProps) {
  // Button fields don't have editable values, they only trigger actions
  // So we just render the display component
  return (
    <ButtonFieldDisplay
      value={value}
      config={config}
      field={field}
      pageId={pageId}
    />
  );
}
