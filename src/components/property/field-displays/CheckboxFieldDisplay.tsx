
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckboxPropertyConfig } from '@/types/property/configs/checkbox';
import { DatabaseField } from '@/types/database';

interface CheckboxFieldDisplayProps {
  value: string;
  config: CheckboxPropertyConfig;
  field: DatabaseField;
  pageId?: string;
}

export function CheckboxFieldDisplay({
  value,
  config,
  field,
  pageId
}: CheckboxFieldDisplayProps) {
  const isChecked = value === 'true';

  return (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={isChecked}
        disabled
        className="pointer-events-none"
        aria-label={`${field.name}: ${isChecked ? (config.trueLabel || 'Yes') : (config.falseLabel || 'No')}`}
      />
    </div>
  );
}
