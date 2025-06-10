
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
