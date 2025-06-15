
import React from 'react';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { PhonePropertyConfig } from '@/types/property/configs/phone';
import { PhonePropertyConfigEditor } from '../config-editors/PhonePropertyConfigEditor';
import { Input } from '@/components/ui/input';
import { Phone } from 'lucide-react';
import { ClickableLinkDisplay } from '../field-displays/ClickableLinkDisplay';

const FieldDisplay: React.FC<{ value: any; config: PhonePropertyConfig; }> = ({ value }) => {
  return <ClickableLinkDisplay value={value} type="phone" />;
};

const FieldEditor: React.FC<{
  value: any;
  config: PhonePropertyConfig;
  onChange: (value: any) => void;
}> = ({ value, config, onChange }) => {
  return (
    <Input
      type="tel"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={config.placeholder || 'Enter a phone number'}
      className="border-none bg-transparent p-1 focus-visible:ring-1"
      autoFocus
    />
  );
};

export const phonePropertyType: PropertyTypeDefinition<PhonePropertyConfig> = {
  type: 'phone',
  label: 'Phone',
  description: 'A phone number',
  icon: <Phone className="h-4 w-4" />,
  category: 'basic',
  
  getDefaultConfig: () => ({
    required: false,
  }),
  
  validateConfig: (config) => ({ isValid: true, errors: [] }),
  
  getDefaultValue: (config) => config.defaultValue || '',
  
  validateValue: (value, config) => {
    const errors: string[] = [];
    if (config.required && !value) {
      errors.push('Phone number is required.');
    }
    if (value && !/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/.test(value)) {
      errors.push('Invalid phone number format.');
    }
    return { isValid: errors.length === 0, errors };
  },
  
  formatValue: (value) => (value || '').toString(),
  parseValue: (input) => input,
  
  ConfigEditor: PhonePropertyConfigEditor,
  FieldDisplay,
  FieldEditor,
  
  supportsFiltering: true,
  supportsSorting: true,
  supportsGrouping: false,
};
