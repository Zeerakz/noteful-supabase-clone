
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { Block } from '@/types/block';

export interface UseDatabaseTableDataProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filterGroup: FilterGroup;
  sortRules: SortRule[];
  onFieldsChange?: () => void;
  groupingConfig?: any;
  collapsedGroups?: string[];
  enableServerSidePagination?: boolean;
  paginationConfig?: {
    page: number;
    limit: number;
  };
}

export interface PageWithProperties {
  id: string;
  title: string;
  workspace_id: string;
  database_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  pos: number;
  properties: Record<string, any>;
  rawPage: Block;
}

export interface DatabaseTableDataReturn {
  userProfiles: any;
  fieldsToUse: DatabaseField[];
  fieldOperations: any;
  pagesWithProperties: PageWithProperties[];
  pagesLoading: boolean;
  pagesError: string | null;
  refetchPages: () => void;
  handleCreateRow: () => Promise<void>;
  handleDeleteRow: (pageId: string) => Promise<void>;
  handleTitleUpdate: (pageId: string, newTitle: string) => Promise<void>;
  handlePropertyUpdate: (pageId: string, propertyId: string, value: string) => void;
  pagination: any;
  totalPages: number;
  itemsPerPage: number;
  handleItemsPerPageChange: (newItemsPerPage: number) => void;
  handleFieldReorder: (draggedFieldId: string, targetFieldId: string, position: 'before' | 'after') => Promise<void>;
  groupedData: any[];
  hasGrouping: boolean;
}
