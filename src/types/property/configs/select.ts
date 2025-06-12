
import { BasePropertyConfig } from '../base';

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
