
import React from 'react';
import { Link } from 'lucide-react';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { RelationPropertyConfig } from '@/types/property/configs/relation';
import { RelationFieldDisplay } from '@/components/database/fields/RelationFieldDisplay';
import { RelationFieldEditor } from '@/components/database/fields/RelationFieldEditor';
import { RelationPropertyConfigEditor } from '@/components/property/config-editors/RelationPropertyConfigEditor';

export const relationPropertyType: PropertyTypeDefinition<RelationPropertyConfig> = {
  type: 'relation',
  label: 'Relation',
  description: 'Link to pages in another database',
  icon: <Link className="h-4 w-4" />,
  category: 'relationship',

  getDefaultConfig: (): RelationPropertyConfig => ({
    targetDatabaseId: '',
    allowMultiple: false,
    bidirectional: false,
  }),

  validateConfig: (config: RelationPropertyConfig) => {
    const errors: string[] = [];
    
    if (!config.targetDatabaseId) {
      errors.push('Target database is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  getDefaultValue: () => null,

  validateValue: (value: any) => {
    // Allow null, string (single relation), or array of strings (multiple relations)
    if (value === null || value === undefined) {
      return { isValid: true, errors: [] };
    }
    
    if (typeof value === 'string') {
      return { isValid: true, errors: [] };
    }
    
    if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
      return { isValid: true, errors: [] };
    }
    
    return {
      isValid: false,
      errors: ['Value must be null, a string, or an array of strings']
    };
  },

  formatValue: (value: any, config: RelationPropertyConfig) => {
    if (!value) return '';
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    return String(value);
  },

  parseValue: (input: string) => {
    if (!input || input.trim() === '') return null;
    return input.trim();
  },

  ConfigEditor: RelationPropertyConfigEditor,
  
  FieldDisplay: ({ value, config }) => {
    console.log('RelationPropertyType FieldDisplay rendering with:', { value, config });
    return (
      <RelationFieldDisplay 
        value={value} 
        settings={{
          target_database_id: config.targetDatabaseId,
          display_property: config.displayProperty,
          allow_multiple: config.allowMultiple,
          bidirectional: config.bidirectional,
          related_property_name: config.relatedPropertyName,
        }} 
      />
    );
  },
  
  FieldEditor: ({ value, config, onChange, workspaceId, pageId }) => (
    <RelationFieldEditor
      value={value}
      onChange={onChange}
      settings={{
        target_database_id: config.targetDatabaseId,
        display_property: config.displayProperty,
        allow_multiple: config.allowMultiple,
        bidirectional: config.bidirectional,
        related_property_name: config.relatedPropertyName,
      }}
      workspaceId={workspaceId || ''}
      isMultiple={config.allowMultiple || false}
      showBacklink={config.bidirectional || false}
    />
  ),

  supportsFiltering: true,
  supportsSorting: true,
  supportsGrouping: true,

  exportValue: (value: any) => {
    return value ? String(value) : '';
  },

  importValue: (input: string) => {
    return input.trim() || null;
  },

  searchableText: (value: any) => {
    return value ? String(value) : '';
  }
};
