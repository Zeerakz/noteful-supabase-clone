
import { BasePropertyConfig } from '../base';

export interface ProgressPropertyConfig extends BasePropertyConfig {
  min?: number;
  max?: number;
  unit?: string;
  displayAs?: 'bar' | 'circle' | 'number';
  showPercentage?: boolean;
  color?: string;
  defaultValue?: number;
}
