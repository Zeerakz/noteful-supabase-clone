
export interface Page {
  id: string;
  workspace_id: string;
  parent_page_id?: string;
  database_id?: string;
  title: string;
  created_by: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface PageCreateRequest {
  title: string;
  parentPageId?: string;
  databaseId?: string;
}

export interface PageUpdateRequest {
  title?: string;
  parent_page_id?: string;
  database_id?: string;
  order_index?: number;
}

export interface PageHierarchyUpdate {
  pageId: string;
  newParentId: string | null;
  newIndex: number;
}
