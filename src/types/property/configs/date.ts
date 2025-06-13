
import { BasePropertyConfig } from '../base';

export interface DatePropertyConfig extends BasePropertyConfig {
  includeTime?: boolean;
  format?: 'relative' | 'absolute' | 'custom';
  customFormat?: string;
  timezone?: string;
  defaultValue?: string;
  minDate?: string;
  maxDate?: string;
  // New features
  enableRange?: boolean;
  enableNaturalLanguage?: boolean;
  enableReminders?: boolean;
  defaultReminderOffset?: number; // minutes before
  allowedTimezones?: string[];
}
