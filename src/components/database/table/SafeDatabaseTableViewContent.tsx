
import React from 'react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { DatabaseTableViewContent } from './DatabaseTableViewContent';
import { errorHandler } from '@/utils/errorHandler';
import { DatabaseField } from '@/types/database';
import { SortRule } from '@/components/database/SortingModal';
import { Block } from '@/types/block';

interface PageWithProperties {
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

interface PaginationInfo {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

interface SafeDatabaseTableViewContentProps {
  pagesWithProperties: PageWithProperties[];
  fields: DatabaseField[];
  pagesLoading: boolean;
  pagesError: string | null;
  onCreateRow: () => Promise<void>;
  onTitleUpdate: (pageId: string, newTitle: string) => Promise<void>;
  onPropertyUpdate: (pageId: string, fieldId: string, value: string) => void;
  onDeleteRow: (pageId: string) => Promise<void>;
  onRefetch: () => void;
  onFieldsChange?: () => void;
  onFieldReorder?: (draggedFieldId: string, targetFieldId: string, position: 'before' | 'after') => void;
  onShowManageProperties?: () => void;
  pagination: PaginationInfo | null;
  totalPages: number;
  databaseId: string;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
  workspaceId: string;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export function SafeDatabaseTableViewContent(props: SafeDatabaseTableViewContentProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        errorHandler.logError(error, {
          context: 'database_table_view',
          props: {
            databaseId: props.databaseId,
            pagesCount: props.pagesWithProperties?.length || 0,
            fieldsCount: props.fields?.length || 0,
          },
          componentStack: errorInfo.componentStack
        });
      }}
      fallback={
        <div className="flex items-center justify-center h-full bg-background">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium text-foreground">Table View Error</h3>
            <p className="text-muted-foreground">
              There was an error loading the table view. Please try refreshing the page.
            </p>
          </div>
        </div>
      }
    >
      <DatabaseTableViewContent {...props} />
    </ErrorBoundary>
  );
}
