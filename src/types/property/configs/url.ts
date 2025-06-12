
import { BasePropertyConfig } from '../base';

export interface UrlPropertyConfig extends BasePropertyConfig {
  allowedDomains?: string[];
  displayAs?: 'link' | 'embed' | 'preview';
  defaultValue?: string;
}
