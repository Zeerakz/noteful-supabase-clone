
import React from 'react';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { ButtonPropertyConfig } from '@/types/property/configs/button';
import { Button } from '@/components/ui/button';
import { MousePointer } from 'lucide-react';
import { ButtonPropertyConfigEditor } from '../config-editors/ButtonPropertyConfigEditor';
import { ButtonFieldDisplay } from '../field-displays/ButtonFieldDisplay';
import { ButtonFieldEditor } from '../field-editors/ButtonFieldEditor';

export const buttonPropertyType: PropertyTypeDefinition<ButtonPropertyConfig> = {
  type: 'button',
  label: 'Button',
  description: 'Configurable button with custom actions',
  icon: <MousePointer className="h-4 w-4" />,
  category: 'basic',
  
  getDefaultConfig: () => ({
    required: false,
    description: '',
    placeholder: '',
    label: 'Click me',
    actions: [],
    variant: 'default',
    size: 'default',
    disabled: false,
  }),
  
  validateConfig: (config: ButtonPropertyConfig) => {
    const errors: string[] = [];
    
    if (!config.label || config.label.trim() === '') {
      errors.push('Button label is required');
    }
    
    if (config.actions.length === 0) {
      errors.push('At least one action is required');
    }
    
    config.actions.forEach((action, index) => {
      if (!action.label || action.label.trim() === '') {
        errors.push(`Action ${index + 1} label is required`);
      }
      
      switch (action.type) {
        case 'create_page_with_template':
          if (!action.config.templateId) {
            errors.push(`Action ${index + 1}: Template ID is required`);
          }
          break;
        case 'set_property_value':
          if (!action.config.targetFieldId) {
            errors.push(`Action ${index + 1}: Target field ID is required`);
          }
          break;
        case 'open_link':
          if (!action.config.url) {
            errors.push(`Action ${index + 1}: URL is required`);
          }
          break;
      }
    });
    
    return { isValid: errors.length === 0, errors };
  },
  
  getDefaultValue: () => null,
  
  validateValue: () => ({ isValid: true, errors: [] }),
  
  formatValue: () => '',
  
  parseValue: () => null,
  
  ConfigEditor: ButtonPropertyConfigEditor,
  FieldDisplay: ButtonFieldDisplay,
  FieldEditor: ButtonFieldEditor,
  
  isComputed: false,
  supportsFiltering: false,
  supportsSorting: false,
  supportsGrouping: false,
};
