
export interface Database {
  id: string;
  workspace_id: string;
  name: string;
  table_name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseField {
  id: string;
  database_id: string;
  name: string;
  type: string;
  settings?: any;
  pos: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCreateRequest {
  name: string;
  description?: string;
  fields: {
    name: string;
    type: string;
    settings?: any;
  }[];
}

export interface PageProperty {
  id: string;
  page_id: string;
  field_id: string;
  value?: string;
  computed_value?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseView {
  id: string;
  database_id: string;
  user_id: string;
  default_view_type: 'table' | 'list' | 'calendar' | 'kanban';
  created_at: string;
  updated_at: string;
}

export interface FieldDependency {
  id: string;
  source_field_id: string;
  dependent_field_id: string;
  created_at: string;
}

// Field type definitions for better type safety
export type FieldType = 
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'relation'
  | 'formula'
  | 'rollup';

// Settings types for complex fields
export interface FormulaFieldSettings {
  formula: string;
  return_type: 'number' | 'text' | 'date' | 'boolean';
  referenced_fields?: string[];
}

export interface RollupFieldSettings {
  relation_field_id: string;
  rollup_property: string;
  aggregation: 'sum' | 'count' | 'average' | 'min' | 'max' | 'earliest' | 'latest';
  target_database_id: string;
}

export interface RelationFieldSettings {
  target_database_id: string;
  display_property?: string;
}

export interface SelectFieldSettings {
  options: {
    id: string;
    name: string;
    color?: string;
  }[];
}
