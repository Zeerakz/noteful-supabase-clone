export interface Database {
  id: string;
  workspace_id: string;
  name: string;
  table_name: string;
  description?: string;
  icon?: string;
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
  visibility_setting?: 'always_show' | 'always_hide' | 'show_when_not_empty';
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
  default_view_type: 'table' | 'list' | 'timeline' | 'calendar' | 'kanban' | 'form' | 'gallery';
  grouping_field_id?: string;
  grouping_collapsed_groups?: string[];
  created_at: string;
  updated_at: string;
}

export interface SavedDatabaseView {
  id: string;
  database_id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  description?: string;
  view_type: 'table' | 'list' | 'timeline' | 'calendar' | 'kanban' | 'form' | 'gallery';
  filters: any; // Changed from any[] to any to support both JSON strings and parsed objects
  sorts: any; // Changed from any[] to any to support both JSON strings and parsed objects
  grouping_field_id?: string;
  grouping_collapsed_groups?: string[];
  visible_field_ids: string[]; // New property for visible fields
  is_shared: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface SavedViewPermission {
  id: string;
  view_id: string;
  user_id: string;
  permission_type: 'view' | 'edit';
  granted_by: string;
  created_at: string;
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
  | 'rollup'
  | 'file_attachment'
  | 'image'
  | 'created_time'
  | 'created_by'
  | 'last_edited_time'
  | 'last_edited_by'
  | 'id'
  | 'button';

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
  allow_multiple?: boolean;
  bidirectional?: boolean;
  related_property_name?: string;
}

export interface SelectFieldSettings {
  options: {
    id: string;
    name: string;
    color?: string;
  }[];
}
