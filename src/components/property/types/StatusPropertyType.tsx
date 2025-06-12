
import React from 'react';
import { Circle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { StatusPropertyConfig } from '@/types/property';
import { StatusPropertyConfigEditor } from '../config-editors/StatusPropertyConfigEditor';
import { StatusFieldDisplay } from '../field-displays/StatusFieldDisplay';
import { StatusFieldEditor } from '../field-editors/StatusFieldEditor';

export const statusPropertyType: PropertyTypeDefinition<StatusPropertyConfig> = {
  type: 'status',
  label: 'Status',
  description: 'Track progress with grouped status options',
  icon: <CheckCircle className="h-4 w-4" />,
  category: 'basic',
  
  getDefaultConfig: (): StatusPropertyConfig => ({
    required: false,
    groups: [
      {
        id: 'todo',
        name: 'To-do',
        color: '#64748b',
        options: [
          { id: 'not-started', name: 'Not Started', color: '#64748b', groupId: 'todo' }
        ]
      },
      {
        id: 'in-progress', 
        name: 'In Progress',
        color: '#3b82f6',
        options: [
          { id: 'in-progress', name: 'In Progress', color: '#3b82f6', groupId: 'in-progress' },
          { id: 'blocked', name: 'Blocked', color: '#ef4444', groupId: 'in-progress' }
        ]
      },
      {
        id: 'complete',
        name: 'Complete', 
        color: '#22c55e',
        options: [
          { id: 'done', name: 'Done', color: '#22c55e', groupId: 'complete' }
        ]
      }
    ],
    defaultStatus: 'not-started',
    displayAs: 'dropdown'
  }),
  
  validateConfig: (config: StatusPropertyConfig) => {
    const errors: string[] = [];
    
    if (!config.groups || config.groups.length === 0) {
      errors.push('At least one status group is required');
    }
    
    // Validate that all options belong to exactly one group
    const allOptions = config.groups?.flatMap(group => group.options || []) || [];
    const optionGroupMap = new Map<string, string>();
    
    for (const group of config.groups || []) {
      for (const option of group.options || []) {
        if (optionGroupMap.has(option.id)) {
          errors.push(`Status option "${option.name}" belongs to multiple groups`);
        }
        optionGroupMap.set(option.id, group.id);
        
        if (option.groupId !== group.id) {
          errors.push(`Status option "${option.name}" has incorrect groupId`);
        }
      }
    }
    
    return { isValid: errors.length === 0, errors };
  },
  
  getDefaultValue: (config: StatusPropertyConfig) => {
    return config.defaultStatus || config.groups?.[0]?.options?.[0]?.id || '';
  },
  
  validateValue: (value: any, config: StatusPropertyConfig) => {
    const errors: string[] = [];
    
    if (config.required && (!value || value.trim() === '')) {
      errors.push('Status is required');
      return { isValid: false, errors };
    }
    
    if (value && value.trim() !== '') {
      const allOptions = config.groups?.flatMap(group => group.options || []) || [];
      const validOption = allOptions.find(opt => opt.id === value);
      
      if (!validOption) {
        errors.push('Invalid status value');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  },
  
  formatValue: (value: any, config: StatusPropertyConfig) => {
    if (!value) return '';
    
    const allOptions = config.groups?.flatMap(group => group.options || []) || [];
    const option = allOptions.find(opt => opt.id === value);
    return option?.name || value;
  },
  
  parseValue: (input: string, config: StatusPropertyConfig) => {
    const allOptions = config.groups?.flatMap(group => group.options || []) || [];
    const option = allOptions.find(opt => 
      opt.name.toLowerCase() === input.toLowerCase() || 
      opt.id === input
    );
    return option?.id || input;
  },
  
  ConfigEditor: StatusPropertyConfigEditor,
  FieldDisplay: StatusFieldDisplay,
  FieldEditor: StatusFieldEditor,
  
  supportsFiltering: true,
  supportsSorting: true,
  supportsGrouping: true,
  
  exportValue: (value: any, config: StatusPropertyConfig) => {
    return formatValue(value, config);
  },
  
  importValue: (input: string, config: StatusPropertyConfig) => {
    return parseValue(input, config);
  },
  
  searchableText: (value: any, config: StatusPropertyConfig) => {
    return formatValue(value, config);
  }
};

// Helper functions
function formatValue(value: any, config: StatusPropertyConfig): string {
  if (!value) return '';
  
  const allOptions = config.groups?.flatMap(group => group.options || []) || [];
  const option = allOptions.find(opt => opt.id === value);
  return option?.name || value;
}

function parseValue(input: string, config: StatusPropertyConfig): string {
  const allOptions = config.groups?.flatMap(group => group.options || []) || [];
  const option = allOptions.find(opt => 
    opt.name.toLowerCase() === input.toLowerCase() || 
    opt.id === input
  );
  return option?.id || input;
}
