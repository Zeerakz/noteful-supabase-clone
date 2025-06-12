
import { BasePropertyConfig } from '../base';

export interface PhonePropertyConfig extends BasePropertyConfig {
  format?: 'international' | 'national' | 'custom';
  customFormat?: string;
  allowedCountries?: string[];
  defaultCountryCode?: string;
  defaultValue?: string;
}
