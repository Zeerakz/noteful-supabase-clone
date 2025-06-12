
import { BasePropertyConfig } from '../base';

export interface StatusPropertyConfig extends BasePropertyConfig {
  groups: StatusGroup[];
  defaultStatus?: string;
  workflow?: {
    [fromStatus: string]: string[];
  };
  displayAs?: 'dropdown' | 'buttons' | 'progress';
}

export interface StatusGroup {
  id: string;
  name: string;
  color: string;
  options: StatusOptionWithGroup[];
}

export interface StatusOptionWithGroup {
  id: string;
  name: string;
  color: string;
  groupId: string;
  description?: string;
}
