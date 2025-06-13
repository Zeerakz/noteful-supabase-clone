
import React from 'react';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { CheckboxPropertyConfig } from '@/types/property/configs/checkbox';
import { CheckboxPropertyConfigEditor } from '../config-editors/CheckboxPropertyConfigEditor';
import { CheckboxFieldEditor } from '../field-editors/CheckboxFieldEditor';
import { CheckboxFieldDisplay } from '../field-displays/CheckboxFieldDisplay';

export const checkboxPropertyType: PropertyTypeDefinition<CheckboxPropertyConfig> = {
  type: 'checkbox',
  label: 'Checkbox',
  description: 'Binary toggle with keyboard shortcut support',
  icon: React.createElement('div', { className: 'w-4 h-4 border border-gray-400 rounded' }),
  category: 'basic',
  
  getDefaultConfig: (): CheckboxPropertyConfig => ({
    required: false,
    defaultValue: false,
    trueLabel: 'Yes',
    falseLabel: 'No'
  }),
  
  validateConfig: (config: CheckboxPropertyConfig) => {
    const errors: string[] = [];
    
    if (config.trueLabel && config.trueLabel.trim().length === 0) {
      errors.push('True label cannot be empty');
    }
    
    if (config.falseLabel && config.falseLabel.trim().length === 0) {
      errors.push('False label cannot be empty');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  validateValue: (value: any, config: CheckboxPropertyConfig) => {
    const errors: string[] = [];
    
    if (config.required && (value === null || value === undefined)) {
      errors.push('This field is required');
      return { isValid: false, errors };
    }
    
    const isValidBoolean = typeof value === 'boolean' || 
                          value === 'true' || 
                          value === 'false' || 
                          value === null || 
                          value === undefined;
    
    if (!isValidBoolean) {
      errors.push('Value must be a boolean');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  formatValue: (value: any, config: CheckboxPropertyConfig) => {
    if (value === true || value === 'true') {
      return config.trueLabel || 'Yes';
    }
    if (value === false || value === 'false') {
      return config.falseLabel || 'No';
    }
    return config.falseLabel || 'No';
  },
  
  parseValue: (input: string, config: CheckboxPropertyConfig) => {
    if (input === 'true' || input === '1' || input.toLowerCase() === 'yes') {
      return true;
    }
    if (input === 'false' || input === '0' || input.toLowerCase() === 'no') {
      return false;
    }
    return config.defaultValue || false;
  },
  
  getDefaultValue: (config: CheckboxPropertyConfig) => {
    return config.defaultValue ? 'true' : 'false';
  },
  
  ConfigEditor: CheckboxPropertyConfigEditor,
  FieldEditor: CheckboxFieldEditor,
  FieldDisplay: CheckboxFieldDisplay,
  
  supportsFiltering: true,
  supportsSorting: true,
  supportsGrouping: true,
  
  exportValue: (value: any, config: CheckboxPropertyConfig) => {
    return value === true || value === 'true' ? 'true' : 'false';
  },
  
  importValue: (input: string, config: CheckboxPropertyConfig) => {
    return input === 'true' || input === '1' || input.toLowerCase() === 'yes';
  },
  
  searchableText: (value: any, config: CheckboxPropertyConfig) => {
    if (value === true || value === 'true') {
      return config.trueLabel || 'Yes';
    }
    return config.falseLabel || 'No';
  }
};
