
import React from 'react';
import { AiAutofillPropertyConfig } from '@/types/property/configs/aiAutofill';

interface AiAutofillFieldDisplayProps {
  value: string | null;
  config: AiAutofillPropertyConfig;
}

export function AiAutofillFieldDisplay({ value }: AiAutofillFieldDisplayProps) {
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }
  return <div className="text-sm whitespace-pre-wrap">{value}</div>;
}
