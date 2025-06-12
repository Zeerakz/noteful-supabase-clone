
import { BasePropertyConfig } from '../base';

export interface EmailPropertyConfig extends BasePropertyConfig {
  allowedDomains?: string[];
  requireVerification?: boolean;
  defaultValue?: string;
}
