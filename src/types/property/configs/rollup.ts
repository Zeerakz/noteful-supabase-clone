
import { BasePropertyConfig } from '../base';

export interface RollupPropertyConfig extends BasePropertyConfig {
  relationFieldId: string;
  targetPropertyId: string;
  aggregation: 'sum' | 'count' | 'average' | 'min' | 'max' | 'earliest' | 'latest' | 'unique';
  format?: {
    type: 'number' | 'date' | 'text';
    options?: any;
  };
}
