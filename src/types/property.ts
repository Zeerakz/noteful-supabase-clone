export interface BaseProperty {
  id: string;
  name: string;
  type: PropertyType;
  config: PropertyConfig;
  createdAt: string;
  updatedAt: string;
}

export type PropertyType = 
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'datetime'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'relation'
  | 'formula'
  | 'rollup'
  | 'file_attachment'
  | 'rich_text'
  | 'status'
  | 'people'
  | 'rating'
  | 'progress'
  | 'currency';

// Base config interface that all property configs extend
export interface BasePropertyConfig {
  required?: boolean;
  description?: string;
  placeholder?: string;
}

// Text property configuration
export interface TextPropertyConfig extends BasePropertyConfig {
  maxLength?: number;
  minLength?: number;
  multiline?: boolean;
  wrapText?: boolean;
  defaultValue?: string;
}

// Number property configuration
export interface NumberPropertyConfig extends BasePropertyConfig {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  format?: 'integer' | 'decimal' | 'percentage';
  prefix?: string;
  suffix?: string;
  defaultValue?: number;
  displayAs?: 'plain' | 'currency' | 'percentage' | 'progress';
  showPercentage?: boolean;
}

// Select and Multi-select property configuration
export interface SelectOption {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

export interface SelectPropertyConfig extends BasePropertyConfig {
  options: SelectOption[];
  allowMultiple?: boolean;
  allowCustomOptions?: boolean;
  defaultValue?: string | string[];
}

// Date and DateTime property configuration
export interface DatePropertyConfig extends BasePropertyConfig {
  includeTime?: boolean;
  format?: 'relative' | 'absolute' | 'custom';
  customFormat?: string;
  timezone?: string;
  defaultValue?: string;
  minDate?: string;
  maxDate?: string;
}

// Checkbox property configuration
export interface CheckboxPropertyConfig extends BasePropertyConfig {
  defaultValue?: boolean;
  trueLabel?: string;
  falseLabel?: string;
}

// URL property configuration
export interface UrlPropertyConfig extends BasePropertyConfig {
  allowedDomains?: string[];
  displayAs?: 'link' | 'embed' | 'preview';
  defaultValue?: string;
}

// Email property configuration
export interface EmailPropertyConfig extends BasePropertyConfig {
  allowedDomains?: string[];
  requireVerification?: boolean;
  defaultValue?: string;
}

// Phone property configuration
export interface PhonePropertyConfig extends BasePropertyConfig {
  format?: 'international' | 'national' | 'custom';
  customFormat?: string;
  allowedCountries?: string[];
  defaultCountryCode?: string;
  defaultValue?: string;
}

// Relation property configuration
export interface RelationPropertyConfig extends BasePropertyConfig {
  targetDatabaseId: string;
  displayProperty?: string;
  allowMultiple?: boolean;
  bidirectional?: boolean;
  relatedPropertyName?: string;
  filterBy?: Record<string, any>;
}

// Formula property configuration
export interface FormulaPropertyConfig extends BasePropertyConfig {
  formula: string;
  returnType: 'number' | 'text' | 'date' | 'boolean';
  dependencies?: string[];
  format?: {
    type: 'number' | 'date' | 'text';
    options?: any;
  };
}

// Rollup property configuration
export interface RollupPropertyConfig extends BasePropertyConfig {
  relationFieldId: string;
  targetPropertyId: string;
  aggregation: 'sum' | 'count' | 'average' | 'min' | 'max' | 'earliest' | 'latest' | 'unique';
  format?: {
    type: 'number' | 'date' | 'text';
    options?: any;
  };
}

// File attachment property configuration
export interface FileAttachmentPropertyConfig extends BasePropertyConfig {
  allowedTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  allowedExtensions?: string[];
  displayAs?: 'list' | 'gallery' | 'table';
}

// Rich text property configuration
export interface RichTextPropertyConfig extends BasePropertyConfig {
  allowedFormats?: ('bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link' | 'heading' | 'list' | 'quote')[];
  maxLength?: number;
  enableMentions?: boolean;
  enableHashtags?: boolean;
}

// Status property configuration
export interface StatusPropertyConfig extends BasePropertyConfig {
  groups: StatusGroup[];
  defaultStatus?: string;
  workflow?: {
    [fromStatus: string]: string[];
  };
  displayAs?: 'dropdown' | 'buttons' | 'progress';
}

export interface StatusGroup {
  id: string;
  name: string;
  color: string;
  options: StatusOptionWithGroup[];
}

export interface StatusOptionWithGroup {
  id: string;
  name: string;
  color: string;
  groupId: string;
  description?: string;
}

// People property configuration
export interface PeoplePropertyConfig extends BasePropertyConfig {
  allowMultiple?: boolean;
  restrictToWorkspace?: boolean;
  allowExternal?: boolean;
  roles?: string[];
  defaultAssignee?: string;
}

// Rating property configuration
export interface RatingPropertyConfig extends BasePropertyConfig {
  scale: number;
  style?: 'stars' | 'numbers' | 'thumbs' | 'hearts';
  allowHalf?: boolean;
  labels?: {
    low?: string;
    high?: string;
  };
  defaultValue?: number;
}

// Progress property configuration
export interface ProgressPropertyConfig extends BasePropertyConfig {
  min?: number;
  max?: number;
  unit?: string;
  displayAs?: 'bar' | 'circle' | 'number';
  showPercentage?: boolean;
  color?: string;
  defaultValue?: number;
}

// Currency property configuration
export interface CurrencyPropertyConfig extends BasePropertyConfig {
  currency: string;
  precision?: number;
  symbol?: string;
  symbolPosition?: 'before' | 'after';
  thousandsSeparator?: string;
  decimalSeparator?: string;
  defaultValue?: number;
}

// Union type for all property configs
export type PropertyConfig = 
  | TextPropertyConfig
  | NumberPropertyConfig
  | SelectPropertyConfig
  | DatePropertyConfig
  | CheckboxPropertyConfig
  | UrlPropertyConfig
  | EmailPropertyConfig
  | PhonePropertyConfig
  | RelationPropertyConfig
  | FormulaPropertyConfig
  | RollupPropertyConfig
  | FileAttachmentPropertyConfig
  | RichTextPropertyConfig
  | StatusPropertyConfig
  | PeoplePropertyConfig
  | RatingPropertyConfig
  | ProgressPropertyConfig
  | CurrencyPropertyConfig;

// Typed property interfaces for each type
export interface TextProperty extends BaseProperty {
  type: 'text';
  config: TextPropertyConfig;
}

export interface NumberProperty extends BaseProperty {
  type: 'number';
  config: NumberPropertyConfig;
}

export interface SelectProperty extends BaseProperty {
  type: 'select';
  config: SelectPropertyConfig;
}

export interface MultiSelectProperty extends BaseProperty {
  type: 'multi_select';
  config: SelectPropertyConfig;
}

export interface DateProperty extends BaseProperty {
  type: 'date';
  config: DatePropertyConfig;
}

export interface DateTimeProperty extends BaseProperty {
  type: 'datetime';
  config: DatePropertyConfig;
}

export interface CheckboxProperty extends BaseProperty {
  type: 'checkbox';
  config: CheckboxPropertyConfig;
}

export interface UrlProperty extends BaseProperty {
  type: 'url';
  config: UrlPropertyConfig;
}

export interface EmailProperty extends BaseProperty {
  type: 'email';
  config: EmailPropertyConfig;
}

export interface PhoneProperty extends BaseProperty {
  type: 'phone';
  config: PhonePropertyConfig;
}

export interface RelationProperty extends BaseProperty {
  type: 'relation';
  config: RelationPropertyConfig;
}

export interface FormulaProperty extends BaseProperty {
  type: 'formula';
  config: FormulaPropertyConfig;
}

export interface RollupProperty extends BaseProperty {
  type: 'rollup';
  config: RollupPropertyConfig;
}

export interface FileAttachmentProperty extends BaseProperty {
  type: 'file_attachment';
  config: FileAttachmentPropertyConfig;
}

export interface RichTextProperty extends BaseProperty {
  type: 'rich_text';
  config: RichTextPropertyConfig;
}

export interface StatusProperty extends BaseProperty {
  type: 'status';
  config: StatusPropertyConfig;
}

export interface PeopleProperty extends BaseProperty {
  type: 'people';
  config: PeoplePropertyConfig;
}

export interface RatingProperty extends BaseProperty {
  type: 'rating';
  config: RatingPropertyConfig;
}

export interface ProgressProperty extends BaseProperty {
  type: 'progress';
  config: ProgressPropertyConfig;
}

export interface CurrencyProperty extends BaseProperty {
  type: 'currency';
  config: CurrencyPropertyConfig;
}

// Union type for all specific property types
export type Property = 
  | TextProperty
  | NumberProperty
  | SelectProperty
  | MultiSelectProperty
  | DateProperty
  | DateTimeProperty
  | CheckboxProperty
  | UrlProperty
  | EmailProperty
  | PhoneProperty
  | RelationProperty
  | FormulaProperty
  | RollupProperty
  | FileAttachmentProperty
  | RichTextProperty
  | StatusProperty
  | PeopleProperty
  | RatingProperty
  | ProgressProperty
  | CurrencyProperty;

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

// Type guard functions
export function isTextProperty(property: Property): property is TextProperty {
  return property.type === 'text';
}

export function isNumberProperty(property: Property): property is NumberProperty {
  return property.type === 'number';
}

export function isSelectProperty(property: Property): property is SelectProperty {
  return property.type === 'select';
}

export function isMultiSelectProperty(property: Property): property is MultiSelectProperty {
  return property.type === 'multi_select';
}

export function isDateProperty(property: Property): property is DateProperty {
  return property.type === 'date';
}

export function isDateTimeProperty(property: Property): property is DateTimeProperty {
  return property.type === 'datetime';
}

export function isCheckboxProperty(property: Property): property is CheckboxProperty {
  return property.type === 'checkbox';
}

export function isRelationProperty(property: Property): property is RelationProperty {
  return property.type === 'relation';
}

export function isFormulaProperty(property: Property): property is FormulaProperty {
  return property.type === 'formula';
}

export function isRollupProperty(property: Property): property is RollupProperty {
  return property.type === 'rollup';
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
