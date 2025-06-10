
export interface Template {
  id: string;
  name: string;
  content: any;
  workspace_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateCreateRequest {
  name: string;
  content: any;
  workspace_id: string;
}
