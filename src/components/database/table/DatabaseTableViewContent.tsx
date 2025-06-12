
import React, { useState } from 'react';
import { Table } from '@/components/ui/table';
import { EnhancedTableHeader } from './EnhancedTableHeader';
import { DatabaseTableBody } from './DatabaseTableBody';
import { DatabaseTableEmptyStates } from './DatabaseTableEmptyStates';
import { PaginationControls } from '../PaginationControls';
import { DatabaseField } from '@/types/database';
import { SortRule } from '@/components/database/SortingModal';
import { useColumnResizing } from './hooks/useColumnResizing';
import { useTableSorting } from './hooks/useTableSorting';

interface PageWithProperties {
  id: string;
  title: string;
  workspace_id: string;
  database_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  parent_page_id: string | null;
  order_index: number;
  properties: Record<string, string>;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  nextPage: () => void;
  prevPage: () => void;
}

interface DatabaseTableViewContentProps {
  pagesWithProperties: PageWithProperties[];
  fields: DatabaseField[];
  pagesLoading: boolean;
  pagesError: string | null;
  onCreateRow: () => void;
  onTitleUpdate: (pageId: string, title: string) => void;
  onPropertyUpdate: (pageId: string, fieldId: string, value: string) => void;
  onDeleteRow: (pageId: string) => void;
  onRefetch: () => void;
  pagination?: PaginationInfo | null;
  totalPages: number;
  databaseId: string;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
  workspaceId: string;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export function DatabaseTableViewContent({
  pagesWithProperties,
  fields,
  pagesLoading,
  pagesError,
  onCreateRow,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  onRefetch,
  pagination,
  totalPages,
  databaseId,
  sortRules,
  setSortRules,
  workspaceId,
  onItemsPerPageChange
}: DatabaseTableViewContentProps) {
  const { columnWidths, updateColumnWidth } = useColumnResizing({
    defaultWidths: {
      title: 250,
      ...fields.reduce((acc, field) => ({
        ...acc,
        [field.id]: 160
      }), {})
    },
    minWidth: 120,
    maxWidth: 400
  });

  const { handleSort } = useTableSorting({ sortRules, setSortRules });

  if (pagesLoading) {
    return <DatabaseTableEmptyStates.Loading />;
  }

  if (pagesError) {
    return <DatabaseTableEmptyStates.Error error={pagesError} onRetry={onRefetch} />;
  }

  if (pagesWithProperties.length === 0) {
    return <DatabaseTableEmptyStates.Empty onCreateRow={onCreateRow} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          <Table className="relative">
            <EnhancedTableHeader
              fields={fields}
              sortRules={sortRules}
              onSort={handleSort}
              onColumnResize={updateColumnWidth}
              columnWidths={columnWidths}
              stickyHeader={true}
            />
            <DatabaseTableBody
              pagesWithProperties={pagesWithProperties}
              fields={fields}
              onTitleUpdate={onTitleUpdate}
              onPropertyUpdate={onPropertyUpdate}
              onDeleteRow={onDeleteRow}
              workspaceId={workspaceId}
              columnWidths={columnWidths}
            />
          </Table>
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="border-t border-border bg-background/95 backdrop-blur-sm p-4">
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onNextPage={pagination.nextPage}
            onPrevPage={pagination.prevPage}
            onItemsPerPageChange={onItemsPerPageChange}
          />
        </div>
      )}
    </div>
  );
}
