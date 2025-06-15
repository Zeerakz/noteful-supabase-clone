
```typescript
import React from 'react';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { UrlPropertyConfig } from '@/types/property';
import { UrlPropertyConfigEditor } from '../config-editors/UrlPropertyConfigEditor';
import { Input } from '@/components/ui/input';
import { Link } from 'lucide-react';
import { ClickableLinkDisplay } from '../field-displays/ClickableLinkDisplay';

const FieldDisplay: React.FC<{ value: any; config: UrlPropertyConfig; }> = ({ value }) => {
  return <ClickableLinkDisplay value={value} type="url" />;
};

const FieldEditor: React.FC<{
  value: any;
  config: UrlPropertyConfig;
  onChange: (value: any) => void;
}> = ({ value, config, onChange }) => {
  return (
    <Input
      type="url"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={config.placeholder || 'Enter a URL'}
      className="border-none bg-transparent p-1 focus-visible:ring-1"
      autoFocus
    />
  );
};

export const urlPropertyType: PropertyTypeDefinition<UrlPropertyConfig> = {
  type: 'url',
  label: 'URL',
  description: 'A web link',
  icon: <Link className="h-4 w-4" />,
  category: 'basic',
  
  getDefaultConfig: () => ({
    required: false,
  }),
  
  validateConfig: (config) => ({ isValid: true, errors: [] }),
  
  getDefaultValue: (config) => config.defaultValue || '',
  
  validateValue: (value, config) => {
    const errors: string[] = [];
    if (config.required && !value) {
      errors.push('URL is required.');
    }
    if (value) {
      try {
        new URL(value.startsWith('http') ? value : `https://${value}`);
      } catch {
        errors.push('Invalid URL format.');
      }
    }
    return { isValid: errors.length === 0, errors };
  },
  
  formatValue: (value) => String(value || ''),
  parseValue: (input) => input,
  
  ConfigEditor: UrlPropertyConfigEditor,
  FieldDisplay,
  FieldEditor,
  
  supportsFiltering: true,
  supportsSorting: true,
  supportsGrouping: false,
};
```
