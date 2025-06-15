
import React from 'react';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { EmailPropertyConfig } from '@/types/property/configs/email';
import { EmailPropertyConfigEditor } from '../config-editors/EmailPropertyConfigEditor';
import { Input } from '@/components/ui/input';
import { AtSign } from 'lucide-react';
import { ClickableLinkDisplay } from '../field-displays/ClickableLinkDisplay';

const FieldDisplay: React.FC<{ value: any; config: EmailPropertyConfig; }> = ({ value }) => {
  return <ClickableLinkDisplay value={value} type="email" />;
};

const FieldEditor: React.FC<{
  value: any;
  config: EmailPropertyConfig;
  onChange: (value: any) => void;
}> = ({ value, config, onChange }) => {
  return (
    <Input
      type="email"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={config.placeholder || 'Enter an email'}
      className="border-none bg-transparent p-1 focus-visible:ring-1"
      autoFocus
    />
  );
};

export const emailPropertyType: PropertyTypeDefinition<EmailPropertyConfig> = {
  type: 'email',
  label: 'Email',
  description: 'An email address',
  icon: <AtSign className="h-4 w-4" />,
  category: 'basic',
  
  getDefaultConfig: () => ({
    required: false,
  }),
  
  validateConfig: (config) => ({ isValid: true, errors: [] }),
  
  getDefaultValue: (config) => config.defaultValue || '',
  
  validateValue: (value, config) => {
    const errors: string[] = [];
    if (config.required && !value) {
      errors.push('Email is required.');
    }
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push('Invalid email format.');
    }
    return { isValid: errors.length === 0, errors };
  },
  
  formatValue: (value) => (value || '').toString(),
  parseValue: (input) => input,
  
  ConfigEditor: EmailPropertyConfigEditor,
  FieldDisplay,
  FieldEditor,
  
  supportsFiltering: true,
  supportsSorting: true,
  supportsGrouping: false,
};
