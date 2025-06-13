
export interface GroupingLevel {
  fieldId: string;
  level: number; // 0 = primary, 1 = secondary, etc.
}

export interface GroupingConfig {
  levels: GroupingLevel[];
  maxLevels: number;
}

export interface GroupedItem {
  id: string;
  title: string;
  properties: Record<string, string>;
  groupPath: string[]; // Array of group values from primary to deepest level
}

export interface GroupNode {
  value: string;
  items: GroupedItem[];
  children: Map<string, GroupNode>;
  level: number;
  fieldId: string;
  isCollapsed?: boolean;
}

export interface FlattenedGroup {
  groupPath: string[];
  groupValue: string;
  level: number;
  fieldId: string;
  items: GroupedItem[];
  isCollapsed: boolean;
}
