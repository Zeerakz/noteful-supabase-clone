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

/**
 * Extended page interface that includes navigation context
 */
export interface PageWithNavigation extends Page {
  /** Navigation item reference if this page is part of the navigation tree */
  navigation_item_id?: string;
  /** Whether this page is favorited in navigation */
  is_favorited?: boolean;
  /** Last access time for navigation sorting */
  last_accessed?: string;
}

/**
 * Request for creating a page with navigation context
 */
export interface PageWithNavigationCreateRequest extends PageCreateRequest {
  /** Parent navigation item ID (could be a section or another page) */
  parentNavigationId?: string;
  /** Whether to create a navigation item for this page */
  createNavigationItem?: boolean;
  /** Custom order index in navigation */
  navigationOrderIndex?: number;
}
