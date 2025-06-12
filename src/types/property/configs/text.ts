
import { BasePropertyConfig } from '../base';

export interface TextPropertyConfig extends BasePropertyConfig {
  maxLength?: number;
  minLength?: number;
  multiline?: boolean;
  wrapText?: boolean;
  defaultValue?: string;
}
