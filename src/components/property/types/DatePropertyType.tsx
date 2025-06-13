
import React from 'react';
import { Calendar } from 'lucide-react';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { DatePropertyConfig } from '@/types/property/configs/date';
import { DatePropertyConfigEditor } from '../config-editors/DatePropertyConfigEditor';
import { DateFieldDisplay } from '@/components/database/fields/DateFieldDisplay';
import { DateFieldEditor } from '@/components/database/fields/DateFieldEditor';

export const datePropertyType: PropertyTypeDefinition<DatePropertyConfig> = {
  type: 'date',
  label: 'Date',
  description: 'Date picker with optional time',
  icon: <Calendar className="h-4 w-4" />,
  category: 'basic',

  getDefaultConfig: () => ({
    includeTime: false,
    format: 'relative',
    timezone: 'UTC',
    enableRange: false,
    enableNaturalLanguage: false,
    enableReminders: false,
  }),

  validateConfig: (config: DatePropertyConfig) => {
    const errors: string[] = [];
    
    if (config.format && !['relative', 'absolute', 'custom'].includes(config.format)) {
      errors.push('Format must be relative, absolute, or custom');
    }
    
    if (config.customFormat && config.format !== 'custom') {
      errors.push('Custom format can only be used when format is set to custom');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  getDefaultValue: () => '',

  validateValue: (value: any) => {
    if (!value || value === '') {
      return { isValid: true, errors: [] };
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { isValid: false, errors: ['Invalid date format'] };
    }

    return { isValid: true, errors: [] };
  },

  formatValue: (value: any) => {
    if (!value || value === '') return '';
    
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      
      return date.toLocaleDateString();
    } catch {
      return value;
    }
  },

  parseValue: (input: string) => {
    if (!input || input.trim() === '') return '';
    
    try {
      const date = new Date(input);
      if (isNaN(date.getTime())) return input;
      
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch {
      return input;
    }
  },

  ConfigEditor: DatePropertyConfigEditor,
  FieldDisplay: DateFieldDisplay,
  FieldEditor: DateFieldEditor,

  isComputed: false,
  supportsFiltering: true,
  supportsSorting: true,
  supportsGrouping: true,
};
