export interface BaseProperty {
  id: string;
  name: string;
  type: PropertyType;
  config: PropertyConfig;
  createdAt: string;
  updatedAt: string;
  database_id?: string;
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
  | 'currency'
  | 'button'
  | 'created_time'
  | 'created_by'
  | 'last_edited_time'
  | 'last_edited_by'
  | 'id'
  | 'ai_autofill'
  | 'unsupported';

// Base config interface that all property configs extend
export interface BasePropertyConfig {
  required?: boolean;
  description?: string;
  placeholder?: string;
}

// Import all specific config types
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
  | CurrencyPropertyConfig
  | ButtonPropertyConfig
  | AiAutofillPropertyConfig;

// Forward declare all config interfaces (will be imported from specific files)
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
import type { ButtonPropertyConfig } from './configs/button';
import type { AiAutofillPropertyConfig } from './configs/aiAutofill';
