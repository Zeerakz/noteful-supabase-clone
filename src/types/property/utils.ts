
import { PropertyType, PropertyConfig } from './base';
import type { TextPropertyConfig } from './configs/text';
import type { NumberPropertyConfig } from './configs/number';
import type { SelectPropertyConfig } from './configs/select';
import type { DatePropertyConfig } from './configs/date';
import type { CheckboxPropertyConfig } from './configs/checkbox';
import type { UrlPropertyConfig } from './configs/url';
import type { EmailPropertyConfig } from './configs/email';
import type { PhonePropertyConfig } from './configs/phone';
import type { RelationPropertyConfig } from './configs/relation';
import type { FormulaPropertyConfig } from './configs/formula';
import type { RollupPropertyConfig } from './configs/rollup';
import type { FileAttachmentPropertyConfig } from './configs/fileAttachment';
import type { RichTextPropertyConfig } from './configs/richText';
import type { StatusPropertyConfig } from './configs/status';
import type { PeoplePropertyConfig } from './configs/people';
import type { RatingPropertyConfig } from './configs/rating';
import type { ProgressPropertyConfig } from './configs/progress';
import type { CurrencyPropertyConfig } from './configs/currency';
import { Property } from './propertyTypes';

// Utility types for working with properties
export type PropertyValue<T extends PropertyType> = T extends 'text' | 'url' | 'email' | 'phone' | 'rich_text'
  ? string
  : T extends 'number' | 'rating' | 'progress' | 'currency'
  ? number
  : T extends 'checkbox'
  ? boolean
  : T extends 'date' | 'datetime'
  ? string
  : T extends 'select'
  ? string
  : T extends 'multi_select' | 'people'
  ? string[]
  : T extends 'relation'
  ? string | string[]
  : T extends 'file_attachment'
  ? File[]
  : T extends 'formula' | 'rollup'
  ? any
  : T extends 'status'
  ? string
  : any;

// Helper function to get default config for a property type
export function getDefaultConfigForType(type: PropertyType): PropertyConfig {
  switch (type) {
    case 'text':
      return { required: false, multiline: false, wrapText: false };
    case 'number':
      return { required: false, format: 'decimal', precision: 2, displayAs: 'plain', showPercentage: false };
    case 'select':
    case 'multi_select':
      return { required: false, options: [], allowMultiple: type === 'multi_select' };
    case 'date':
      return { required: false, includeTime: false, format: 'relative' };
    case 'datetime':
      return { required: false, includeTime: true, format: 'relative' };
    case 'checkbox':
      return { required: false, defaultValue: false };
    case 'url':
      return { required: false, displayAs: 'link' };
    case 'email':
      return { required: false };
    case 'phone':
      return { required: false, format: 'international' };
    case 'relation':
      return { required: false, targetDatabaseId: '', allowMultiple: false };
    case 'formula':
      return { required: false, formula: '', returnType: 'text' };
    case 'rollup':
      return { required: false, relationFieldId: '', targetPropertyId: '', aggregation: 'count' };
    case 'file_attachment':
      return { required: false, maxFiles: 10, displayAs: 'list' };
    case 'rich_text':
      return { required: false, allowedFormats: ['bold', 'italic', 'link'] };
    case 'status':
      return { 
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
      };
    case 'people':
      return { required: false, allowMultiple: false, restrictToWorkspace: true };
    case 'rating':
      return { required: false, scale: 5, style: 'stars', allowHalf: false };
    case 'progress':
      return { required: false, min: 0, max: 100, displayAs: 'bar', showPercentage: true };
    case 'currency':
      return { required: false, currency: 'USD', precision: 2, symbolPosition: 'before' };
    default:
      return { required: false };
  }
}

// Validation helpers
export function validatePropertyConfig(type: PropertyType, config: PropertyConfig): boolean {
  try {
    switch (type) {
      case 'select':
      case 'multi_select':
        const selectConfig = config as SelectPropertyConfig;
        return Array.isArray(selectConfig.options) && selectConfig.options.length > 0;
      
      case 'relation':
        const relationConfig = config as RelationPropertyConfig;
        return Boolean(relationConfig.targetDatabaseId);
      
      case 'formula':
        const formulaConfig = config as FormulaPropertyConfig;
        return Boolean(formulaConfig.formula && formulaConfig.returnType);
      
      case 'rollup':
        const rollupConfig = config as RollupPropertyConfig;
        return Boolean(rollupConfig.relationFieldId && rollupConfig.targetPropertyId && rollupConfig.aggregation);
      
      default:
        return true;
    }
  } catch {
    return false;
  }
}
