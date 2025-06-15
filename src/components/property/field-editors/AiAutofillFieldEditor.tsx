
import React from 'react';
import { AiAutofillPropertyConfig } from '@/types/property/configs/aiAutofill';
import { AiAutofillFieldDisplay } from '../field-displays/AiAutofillFieldDisplay';

interface AiAutofillFieldEditorProps {
  value: string | null;
  config: AiAutofillPropertyConfig;
  onChange: (value: string) => void;
  pageId?: string;
}

export function AiAutofillFieldEditor({ value, config, onChange, pageId }: AiAutofillFieldEditorProps) {
  return (
    <AiAutofillFieldDisplay
      value={value}
      config={config}
      onValueChange={onChange}
      pageId={pageId}
    />
  );
}
