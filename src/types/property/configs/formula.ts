
import { BasePropertyConfig } from '../base';

export interface FormulaPropertyConfig extends BasePropertyConfig {
  formula: string;
  returnType: 'number' | 'text' | 'date' | 'boolean';
  dependencies?: string[];
  format?: {
    type: 'number' | 'date' | 'text';
    options?: any;
  };
}
