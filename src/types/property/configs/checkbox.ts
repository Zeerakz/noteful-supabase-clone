
import { BasePropertyConfig } from '../base';

export interface CheckboxPropertyConfig extends BasePropertyConfig {
  defaultValue?: boolean;
  trueLabel?: string;
  falseLabel?: string;
}
