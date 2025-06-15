
import React from 'react';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { TextPropertyConfig } from '@/types/property';
import { TextPropertyConfigEditor } from '../config-editors/TextPropertyConfigEditor';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Type, WrapText } from 'lucide-react';

// Display component for text fields
const TextFieldDisplay: React.FC<{
  value: any;
  config: TextPropertyConfig;
  inTable?: boolean;
}> = ({ value, config, inTable = false }) => {
  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground">—</span>;
  }
  
  const shouldWrap = config.wrapText || false;
  const isMultiline = config.multiline && value.includes('\n');
  
  if (inTable && !shouldWrap && isMultiline) {
    // Show truncated version with ellipsis for multiline content in tables
    const firstLine = value.split('\n')[0];
    const hasMoreLines = value.split('\n').length > 1;
    
    return (
      <div className="flex items-center gap-1">
        <span className="truncate text-foreground">{firstLine}</span>
        {hasMoreLines && (
          <span className="text-muted-foreground text-xs">...</span>
        )}
      </div>
    );
  }
  
  if (inTable && shouldWrap) {
    return (
      <div className={`text-foreground ${shouldWrap ? 'whitespace-pre-wrap break-words' : 'truncate'}`}>
        {value}
      </div>
    );
  }
  
  return (
    <span className={`text-foreground ${isMultiline ? 'whitespace-pre-wrap' : ''}`}>
      {value}
    </span>
  );
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
    if (e.key === 'Enter' && !config.multiline) {
      e.preventDefault();
      onChange(localValue);
    } else if (e.key === 'Escape') {
      setLocalValue(value || '');
    }
  };
  
  if (config.multiline) {
    return (
      <Textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={config.placeholder || 'Enter text'}
        maxLength={config.maxLength}
        className="border-none bg-transparent p-1 focus-visible:ring-1 resize-none min-h-[60px]"
        autoFocus
        rows={3}
      />
    );
  }
  
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
  description: 'Single or multi-line text',
  icon: <Type className="h-4 w-4" />,
  category: 'basic',
  
  getDefaultConfig: () => ({
    required: false,
    multiline: false,
    wrapText: false,
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
