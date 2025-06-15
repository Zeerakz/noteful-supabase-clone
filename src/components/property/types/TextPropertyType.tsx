import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { TextPropertyConfig } from '@/types/property';
import { TextPropertyConfigEditor } from '../config-editors/TextPropertyConfigEditor';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Type } from 'lucide-react';

// Display component for text fields with Markdown support
const TextFieldDisplay: React.FC<{
  value: any;
  config: TextPropertyConfig;
  inTable?: boolean;
}> = ({ value, config, inTable = false }) => {
  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const shouldWrap = config.wrapText || false;

  if (inTable && !shouldWrap) {
    const firstLine = value.split('\n')[0];
    // A simple regex to strip markdown for a clean preview in non-wrapped table cells
    const plainText = firstLine.replace(/([_*~`[\]()#+\-.!])/g, '');
    const hasMoreContent = value.length > plainText.length || value.includes('\n');

    return (
      <div className="flex items-center gap-1">
        <span className="truncate text-foreground">{plainText.substring(0, 100)}</span>
        {hasMoreContent && <span className="text-muted-foreground text-xs">...</span>}
      </div>
    );
  }

  return (
    <div
      className={`text-foreground ${
        shouldWrap || !inTable ? 'whitespace-pre-wrap break-words' : 'truncate'
      }`}
    >
      <ReactMarkdown
        children={value}
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a
              {...props}
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          code: ({ node, ...props }) => (
            <code
              {...props}
              className="bg-muted text-muted-foreground px-1 py-0.5 rounded-sm text-sm font-mono"
            />
          ),
          p: ({ node, ...props }) => <p {...props} className="m-0 p-0" />,
        }}
      />
    </div>
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
  description: 'Single or multi-line text with Markdown support',
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
