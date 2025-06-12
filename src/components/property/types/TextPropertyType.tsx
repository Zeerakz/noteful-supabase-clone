
import React from 'react';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { TextPropertyConfig } from '@/types/property';
import { TextPropertyConfigEditor } from '../config-editors/TextPropertyConfigEditor';
import { Input } from '@/components/ui/input';
import { Type } from 'lucide-react';

// Display component for text fields
const TextFieldDisplay: React.FC<{
  value: any;
  config: TextPropertyConfig;
}> = ({ value, config }) => {
  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground">—</span>;
  }
  
  return <span className="text-foreground">{value}</span>;
};

// Editor component for text fields
const TextFieldEditor: React.FC<{
  value: any;
  config: TextPropertyConfig;
  onChange: (value: any) => void;
}> = ({ value, config, onChange }) => {
  const [localValue, setLocalValue] = React.useState(value || '');
  
  const handleBlur = () => {
    onChange(localValue);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onChange(localValue);
    } else if (e.key === 'Escape') {
      setLocalValue(value || '');
    }
  };
  
  return (
    <Input
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={config.placeholder || 'Enter text'}
      maxLength={config.maxLength}
      className="border-none bg-transparent p-1 focus-visible:ring-1"
      autoFocus
    />
  );
};

// Property type definition
export const textPropertyType: PropertyTypeDefinition<TextPropertyConfig> = {
  type: 'text',
  label: 'Text',
  description: 'Single line of text',
  icon: <Type className="h-4 w-4" />,
  category: 'basic',
  
  getDefaultConfig: () => ({
    required: false,
    multiline: false,
  }),
  
  validateConfig: (config) => {
    const errors: string[] = [];
    
    if (config.minLength !== undefined && config.maxLength !== undefined) {
      if (config.minLength > config.maxLength) {
        errors.push('Minimum length cannot be greater than maximum length');
      }
    }
    
    if (config.minLength !== undefined && config.minLength < 0) {
      errors.push('Minimum length cannot be negative');
    }
    
    return { isValid: errors.length === 0, errors };
  },
  
  getDefaultValue: (config) => config.defaultValue || '',
  
  validateValue: (value, config) => {
    const errors: string[] = [];
    const stringValue = String(value || '');
    
    if (config.required && !stringValue.trim()) {
      errors.push('This field is required');
    }
    
    if (config.minLength !== undefined && stringValue.length < config.minLength) {
      errors.push(`Minimum length is ${config.minLength} characters`);
    }
    
    if (config.maxLength !== undefined && stringValue.length > config.maxLength) {
      errors.push(`Maximum length is ${config.maxLength} characters`);
    }
    
    return { isValid: errors.length === 0, errors };
  },
  
  formatValue: (value, config) => String(value || ''),
  
  parseValue: (input, config) => input,
  
  ConfigEditor: TextPropertyConfigEditor,
  FieldDisplay: TextFieldDisplay,
  FieldEditor: TextFieldEditor,
  
  supportsFiltering: true,
  supportsSorting: true,
  supportsGrouping: false,
  
  exportValue: (value, config) => String(value || ''),
  importValue: (input, config) => input,
  searchableText: (value, config) => String(value || ''),
};
