
import { BasePropertyConfig } from '../base';

export interface RelationPropertyConfig extends BasePropertyConfig {
  targetDatabaseId: string;
  displayProperty?: string;
  allowMultiple?: boolean;
  bidirectional?: boolean;
  relatedPropertyName?: string;
  filterBy?: Record<string, any>;
}
