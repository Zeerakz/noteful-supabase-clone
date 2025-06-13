
import React from 'react';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { CheckboxPropertyConfig } from '@/types/property/configs/checkbox';
import { CheckboxPropertyConfigEditor } from '../config-editors/CheckboxPropertyConfigEditor';
import { CheckboxFieldEditor } from '../field-editors/CheckboxFieldEditor';
import { CheckboxFieldDisplay } from '../field-displays/CheckboxFieldDisplay';

export const checkboxPropertyType: PropertyTypeDefinition = {
  id: 'checkbox',
  name: 'Checkbox',
  category: 'basic',
  description: 'Binary toggle with keyboard shortcut support',
  icon: 'Check',
  defaultConfig: {
    required: false,
    defaultValue: false,
    trueLabel: 'Yes',
    falseLabel: 'No'
  },
  
  validateConfig: (config: CheckboxPropertyConfig) => {
    return true; // Basic validation - all checkbox configs are valid
  },
  
  validateValue: (value: any, config: CheckboxPropertyConfig) => {
    return typeof value === 'boolean' || value === 'true' || value === 'false' || value === null || value === undefined;
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
  
  getDefaultValue: (config: CheckboxPropertyConfig) => {
    return config.defaultValue ? 'true' : 'false';
  },
  
  configEditor: CheckboxPropertyConfigEditor,
  fieldEditor: CheckboxFieldEditor,
  fieldDisplay: CheckboxFieldDisplay,
  
  supportedOperations: ['equals', 'not_equals'],
  isSearchable: false,
  isSortable: true,
  isFilterable: true,
  isGroupable: true
};
