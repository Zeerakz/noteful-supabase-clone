
import React from 'react';
import { User } from 'lucide-react';
import { PeoplePropertyConfig } from '@/types/property';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { PeoplePropertyConfigEditor } from '../config-editors/PeoplePropertyConfigEditor';
import { PeopleFieldDisplay } from '../field-displays/PeopleFieldDisplay';
import { PeopleFieldEditor } from '../field-editors/PeopleFieldEditor';

export const peoplePropertyType: PropertyTypeDefinition<PeoplePropertyConfig> = {
  type: 'people',
  label: 'People',
  description: 'Assign people to this property',
  icon: <User className="h-4 w-4" />,
  category: 'relationship',
  
  getDefaultConfig: () => ({
    required: false,
    allowMultiple: false,
    restrictToWorkspace: true,
    allowExternal: false,
    roles: [],
  }),
  
  validateConfig: (config: PeoplePropertyConfig) => {
    const errors: string[] = [];
    
    if (config.roles && config.roles.some(role => !role.trim())) {
      errors.push('Role names cannot be empty');
    }
    
    if (config.defaultAssignee && typeof config.defaultAssignee !== 'string') {
      errors.push('Default assignee must be a valid user ID');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  getDefaultValue: (config: PeoplePropertyConfig) => {
    return config.defaultAssignee || '';
  },
  
  validateValue: (value: any, config: PeoplePropertyConfig) => {
    const errors: string[] = [];
    
    if (config.required && (!value || value.trim() === '')) {
      errors.push('This field is required');
    }
    
    if (value && config.allowMultiple) {
      // For multiple people, value should be comma-separated user IDs
      const userIds = value.split(',').filter((id: string) => id.trim());
      if (userIds.length === 0 && config.required) {
        errors.push('At least one person must be assigned');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  formatValue: (value: any, config: PeoplePropertyConfig) => {
    if (!value || value.trim() === '') return '';
    
    if (config.allowMultiple) {
      const userIds = value.split(',').filter((id: string) => id.trim());
      return `${userIds.length} person${userIds.length !== 1 ? 's' : ''}`;
    }
    
    return 'Person assigned';
  },
  
  parseValue: (input: string, config: PeoplePropertyConfig) => {
    return input.trim();
  },
  
  ConfigEditor: PeoplePropertyConfigEditor,
  FieldDisplay: PeopleFieldDisplay,
  FieldEditor: PeopleFieldEditor,
  
  supportsFiltering: true,
  supportsSorting: true,
  supportsGrouping: true,
};
