
import React from 'react';
import { AlertTriangle, Code } from 'lucide-react';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { PropertyConfig } from '@/types/property';

const UnsupportedFieldDisplay: React.FC<{
  value: any;
  field?: { type: string, name: string };
}> = ({ value, field }) => (
  <div className="flex items-center gap-2 text-xs text-destructive p-1 bg-destructive/10 rounded-md border border-destructive/20">
    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
    <div className="truncate">
      <span className="font-semibold">Unsupported:</span>
      <span className="ml-1 font-mono text-destructive/80 truncate" title={field?.type || 'unknown'}>
        {field?.type || 'unknown'}
      </span>
    </div>
  </div>
);

const UnsupportedFieldEditor: React.FC<{}> = () => (
  <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">
    This property type cannot be edited.
  </div>
);

const UnsupportedConfigEditor: React.FC<{}> = () => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
    <Code className="h-4 w-4" />
    <span>No configuration available for this property type.</span>
  </div>
);

export const unsupportedPropertyType: PropertyTypeDefinition<PropertyConfig> = {
  type: 'unsupported',
  label: 'Unsupported',
  description: 'Fallback for unsupported or failed property types.',
  icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
  category: 'advanced',

  getDefaultConfig: () => ({}),
  validateConfig: () => ({ isValid: true, errors: [] }),
  getDefaultValue: () => null,
  validateValue: () => ({ isValid: true, errors: [] }),
  formatValue: (value: any) => String(value || ''),
  parseValue: (input: string) => input,

  ConfigEditor: UnsupportedConfigEditor,
  FieldDisplay: UnsupportedFieldDisplay,
  FieldEditor: UnsupportedFieldEditor,

  isComputed: true, // Treat as computed to prevent editing
  supportsFiltering: false,
  supportsSorting: false,
  supportsGrouping: false,
};
