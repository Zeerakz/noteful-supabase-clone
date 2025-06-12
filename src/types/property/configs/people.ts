
import { BasePropertyConfig } from '../base';

export interface PeoplePropertyConfig extends BasePropertyConfig {
  allowMultiple?: boolean;
  restrictToWorkspace?: boolean;
  allowExternal?: boolean;
  roles?: string[];
  defaultAssignee?: string;
}
