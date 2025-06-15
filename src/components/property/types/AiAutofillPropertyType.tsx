
import React from 'react';
import { propertyRegistry, PropertyTypeDefinition } from '@/types/propertyRegistry';
import { AiAutofillPropertyConfig } from '@/types/property/configs/aiAutofill';
import { AiAutofillPropertyConfigEditor } from '../config-editors/AiAutofillPropertyConfigEditor';
import { AiAutofillFieldDisplay } from '../field-displays/AiAutofillFieldDisplay';
import { AiAutofillFieldEditor } from '../field-editors/AiAutofillFieldEditor';
import { Wand2 } from 'lucide-react';

const AiAutofillPropertyType: PropertyTypeDefinition<AiAutofillPropertyConfig> = {
  type: 'ai_autofill',
  label: 'AI Autofill',
  description: 'Generate content based on a custom prompt.',
  icon: <Wand2 className="h-4 w-4" />,
  category: 'computed',
  isComputed: true,

  getDefaultConfig: () => ({
    prompt: '',
  }),

  validateConfig: (config) => {
    const errors: string[] = [];
    if (!config.prompt || config.prompt.trim() === '') {
      errors.push('Prompt cannot be empty.');
    }
    return { isValid: errors.length === 0, errors };
  },

  getDefaultValue: () => null,
  
  validateValue: (value) => ({ isValid: typeof value === 'string' || value === null, errors: [] }),

  formatValue: (value) => (value ? String(value) : ''),

  parseValue: (input) => input,

  ConfigEditor: AiAutofillPropertyConfigEditor,
  FieldDisplay: AiAutofillFieldDisplay,
  FieldEditor: AiAutofillFieldEditor,
};

propertyRegistry.register(AiAutofillPropertyType);
