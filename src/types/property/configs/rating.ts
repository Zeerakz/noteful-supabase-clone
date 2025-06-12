
import { BasePropertyConfig } from '../base';

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
