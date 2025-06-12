
import { BasePropertyConfig } from '../base';

export interface CurrencyPropertyConfig extends BasePropertyConfig {
  currency: string;
  precision?: number;
  symbol?: string;
  symbolPosition?: 'before' | 'after';
  thousandsSeparator?: string;
  decimalSeparator?: string;
  defaultValue?: number;
}
