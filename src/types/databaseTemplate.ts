
export interface DatabaseTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  is_system_template: boolean;
  template_data: {
    fields: Array<{
      name: string;
      type: string;
      settings?: any;
    }>;
    views?: Array<{
      name: string;
      view_type: string;
      is_default?: boolean;
      grouping_field?: string;
      date_field?: string;
      filters?: any[];
    }>;
    sample_data?: Array<Record<string, any>>;
  };
  preview_image_url?: string;
  workspace_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ViewTemplate {
  id: string;
  name: string;
  description?: string;
  view_type: string;
  template_config: any;
  is_system_template: boolean;
  workspace_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTemplateCreateRequest {
  name: string;
  description?: string;
  category: string;
  template_data: DatabaseTemplate['template_data'];
  workspace_id: string;
}
