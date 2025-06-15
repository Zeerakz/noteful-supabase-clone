
import { BasePropertyConfig } from '../base';

export interface NumberPropertyConfig extends BasePropertyConfig {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  format?: 'integer' | 'decimal' | 'percentage';
  prefix?: string;
  suffix?: string;
  defaultValue?: number;
  displayAs?: 'plain' | 'currency' | 'percentage' | 'progress' | 'ring';
  showPercentage?: boolean;
}
