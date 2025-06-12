
import React, { useState, useCallback } from 'react';
import { DatabaseField, PageProperty } from '@/types/database';
import { DatabaseTableHeader } from './DatabaseTableHeader';
import { DatabaseTableRow } from './DatabaseTableRow';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { Settings } from 'lucide-react';
import { SortRule } from '@/components/database/SortingModal';

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
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

interface DatabaseTableViewContentProps {
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
  onFieldsChange,
  onFieldReorder,
  onShowManageProperties,
  pagination,
  totalPages,
  databaseId,
  sortRules,
  setSortRules,
  workspaceId,
  onItemsPerPageChange
}: DatabaseTableViewContentProps) {
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (fieldId: string, direction: 'asc' | 'desc') => {
    setSortBy(fieldId);
    setSortDirection(direction);

    // Update sort rules
    const newSortRules: SortRule[] = [{ fieldId, direction }];
    setSortRules(newSortRules);
  };

  if (pagesLoading) {
    return (
      <div className="flex flex-col h-full">
        <Table className="border-none">
          <TableHeader>
            <TableRow>
              {Array.from({ length: fields.length + 1 }).map((_, i) => (
                <TableHead key={i} className="w-[200px]">
                  <Skeleton className="h-4 w-32" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: fields.length + 1 }).map((_, j) => (
                  <TableCell key={j} className="font-medium">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (pagesError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Error: {pagesError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Manage Properties Button */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Table View</h3>
          <span className="text-sm text-muted-foreground">
            {pagesWithProperties.length} {pagesWithProperties.length === 1 ? 'row' : 'rows'}
          </span>
        </div>
        {onShowManageProperties && (
          <Button
            variant="outline"
            size="sm"
            onClick={onShowManageProperties}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Manage Properties
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <DatabaseTableHeader
          fields={fields}
          sortRules={sortRules}
          onSort={handleSort}
          onFieldsChange={onFieldsChange}
          onFieldReorder={onFieldReorder}
        />
        <div className="overflow-auto">
          <Table className="border-none">
            <TableBody>
              {pagesWithProperties.map((page) => (
                <DatabaseTableRow
                  key={page.id}
                  page={page}
                  fields={fields}
                  onTitleUpdate={(newTitle) => onTitleUpdate(page.id, newTitle)}
                  onPropertyUpdate={(fieldId, value) => onPropertyUpdate(page.id, fieldId, value)}
                  onDeleteRow={() => onDeleteRow(page.id)}
                  workspaceId={workspaceId}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
