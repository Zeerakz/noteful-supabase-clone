import { BaseProperty, PropertyType } from './base';
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

export interface ButtonProperty extends BaseProperty {
  type: 'button';
  config: ButtonPropertyConfig;
}

export interface AiAutofillProperty extends BaseProperty {
  type: 'ai_autofill';
  config: AiAutofillPropertyConfig;
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
  | CurrencyProperty
  | ButtonProperty
  | AiAutofillProperty;
