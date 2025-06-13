
import React from 'react';
import { List } from 'lucide-react';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { SelectPropertyConfig } from '@/types/property/configs/select';
import { SelectPropertyConfigEditor } from '../config-editors/SelectPropertyConfigEditor';
import { SelectFieldDisplay } from '@/components/database/fields/SelectFieldDisplay';
import { SelectFieldEditor } from '@/components/database/fields/SelectFieldEditor';

export const selectPropertyType: PropertyTypeDefinition<SelectPropertyConfig> = {
  type: 'select',
  label: 'Select',
  description: 'Dropdown with predefined options',
  icon: <List className="h-4 w-4" />,
  category: 'basic',

  getDefaultConfig: () => ({
    options: [],
    placeholder: 'Select an option...',
  }),

  validateConfig: (config: SelectPropertyConfig) => {
    const errors: string[] = [];
    
    if (!Array.isArray(config.options)) {
      errors.push('Options must be an array');
    } else if (config.options.length === 0) {
      errors.push('At least one option is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  getDefaultValue: () => '',

  validateValue: (value: any, config: SelectPropertyConfig) => {
    if (!value || value === '') {
      return { isValid: true, errors: [] };
    }

    const validOptions = config.options?.map(opt => typeof opt === 'string' ? opt : opt.id) || [];
    if (!validOptions.includes(value)) {
      return { isValid: false, errors: ['Value must be one of the predefined options'] };
    }

    return { isValid: true, errors: [] };
  },

  formatValue: (value: any, config: SelectPropertyConfig) => {
    if (!value || value === '') return '';
    
    // Find the option to get display label
    const option = config.options?.find(opt => 
      typeof opt === 'string' ? opt === value : opt.id === value
    );
    
    if (option) {
      return typeof option === 'string' ? option : option.name;
    }
    
    return value;
  },

  parseValue: (input: string) => {
    return input;
  },

  ConfigEditor: SelectPropertyConfigEditor,
  FieldDisplay: (props) => <SelectFieldDisplay {...props} config={props.config} />,
  FieldEditor: (props) => <SelectFieldEditor {...props} config={props.config} />,

  isComputed: false,
  supportsFiltering: true,
  supportsSorting: true,
  supportsGrouping: true,
};

// Multi-select variant
export const multiSelectPropertyType: PropertyTypeDefinition<SelectPropertyConfig> = {
  ...selectPropertyType,
  type: 'multi_select',
  label: 'Multi-select',
  description: 'Multiple selection dropdown',

  getDefaultValue: () => '',

  validateValue: (value: any, config: SelectPropertyConfig) => {
    if (!value || value === '') {
      return { isValid: true, errors: [] };
    }

    // Handle comma-separated values
    const values = typeof value === 'string' ? value.split(',').map(v => v.trim()) : [value];
    
    const validOptions = config.options?.map(opt => typeof opt === 'string' ? opt : opt.id) || [];
    const invalidValues = values.filter(v => !validOptions.includes(v));
    
    if (invalidValues.length > 0) {
      return { isValid: false, errors: [`Invalid values: ${invalidValues.join(', ')}`] };
    }

    return { isValid: true, errors: [] };
  },

  formatValue: (value: any, config: SelectPropertyConfig) => {
    if (!value || value === '') return '';
    
    const values = typeof value === 'string' ? value.split(',').map(v => v.trim()) : [value];
    
    return values.map(val => {
      const option = config.options?.find(opt => 
        typeof opt === 'string' ? opt === val : opt.id === val
      );
      return option ? (typeof option === 'string' ? option : option.name) : val;
    }).join(', ');
  },

  FieldEditor: (props) => <SelectFieldEditor {...props} config={props.config} multiSelect />,
  FieldDisplay: (props) => <SelectFieldDisplay {...props} config={props.config} multiSelect />,
};
