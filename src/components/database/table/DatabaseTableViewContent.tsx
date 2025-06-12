
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { DatabaseTableRow } from './DatabaseTableRow';
import { DatabaseField } from '@/types/database';
import { SortRule } from '@/components/database/SortingModal';
import { PaginationControls } from '@/components/database/PaginationControls';

interface PageWithProperties {
  id: string;
  title: string;
  properties: Record<string, string>;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

interface DatabaseTableViewContentProps {
  pagesWithProperties: PageWithProperties[];
  fields: DatabaseField[];
  pagesLoading: boolean;
  pagesError: string | null;
  onCreateRow: () => void;
  onTitleUpdate: (pageId: string, newTitle: string) => void;
  onPropertyUpdate: (pageId: string, fieldId: string, value: string) => void;
  onDeleteRow: (pageId: string) => void;
  onRefetch: () => void;
  pagination?: PaginationInfo | null;
  totalPages: number;
  databaseId: string;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
  workspaceId: string;
  onItemsPerPageChange: (itemsPerPage: number) => void;
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
  if (pagesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading rows...</div>
      </div>
    );
  }

  if (pagesError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-destructive">Error: {pagesError}</div>
        <Button onClick={onRefetch} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalPages} total rows
        </div>
        <Button onClick={onCreateRow} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Row
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background border-r w-[200px]">
                Title
              </TableHead>
              {fields.map((field) => (
                <TableHead key={field.id} className="min-w-[150px]">
                  {field.name}
                </TableHead>
              ))}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagesWithProperties.length === 0 ? (
              <TableRow>
                <td colSpan={fields.length + 2} className="text-center py-8 text-muted-foreground">
                  No rows found. Click "New Row" to add the first row.
                </td>
              </TableRow>
            ) : (
              pagesWithProperties.map((page) => (
                <DatabaseTableRow
                  key={page.id}
                  page={page}
                  fields={fields}
                  onTitleUpdate={onTitleUpdate}
                  onPropertyUpdate={onPropertyUpdate}
                  onDeleteRow={onDeleteRow}
                  workspaceId={workspaceId}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.goToPage}
          itemsPerPage={pagination.itemsPerPage}
          totalItems={pagination.totalItems}
          onItemsPerPageChange={onItemsPerPageChange}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
        />
      )}
    </div>
  );
}
