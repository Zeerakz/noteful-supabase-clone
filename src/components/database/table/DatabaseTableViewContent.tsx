
import React, { useState, useCallback } from 'react';
import { DatabaseField, PageProperty } from '@/types/database';
import { DatabaseTableHeader } from './DatabaseTableHeader';
import { DatabaseTableBody } from './DatabaseTableBody';
import { Table, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { Settings, Plus } from 'lucide-react';
import { SortRule } from '@/components/database/SortingModal';
import { useColumnResizing } from './hooks/useColumnResizing';

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
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [resizingFields, setResizingFields] = useState<Set<string>>(new Set());

  // Column resizing functionality with updated constraints
  const {
    columnWidths,
    updateColumnWidth,
    resetColumnWidth,
    resetAllWidths
  } = useColumnResizing({
    defaultWidths: {
      title: 280,
      ...fields.reduce((acc, field) => ({
        ...acc,
        [field.id]: 200
      }), {})
    },
    minWidth: 120,
    maxWidth: 600
  });

  const handleSort = (fieldId: string, direction: 'asc' | 'desc') => {
    setSortBy(fieldId);
    setSortDirection(direction);

    // Update sort rules
    const newSortRules: SortRule[] = [{ fieldId, direction }];
    setSortRules(newSortRules);
  };

  const handleRowSelect = useCallback((pageId: string, selected: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(pageId);
      } else {
        newSet.delete(pageId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(pagesWithProperties.map(p => p.id)));
    } else {
      setSelectedRows(new Set());
    }
  }, [pagesWithProperties]);

  const handleResizeStateChange = useCallback((newResizingFields: Set<string>) => {
    setResizingFields(newResizingFields);
  }, []);

  // Calculate total width for the table
  const totalTableWidth = 48 + // checkbox column
    (columnWidths['title'] || 280) + // title column
    fields.reduce((acc, field) => acc + (columnWidths[field.id] || 200), 0) + // field columns
    64; // actions column

  if (pagesLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center justify-between p-6 border-b bg-card">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="bg-card border-b">
            <div className="flex">
              <Skeleton className="h-12 w-[250px] border-r" />
              <Skeleton className="h-12 w-[200px] border-r" />
              <Skeleton className="h-12 w-[200px]" />
            </div>
          </div>
          <div className="space-y-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex border-b">
                <Skeleton className="h-16 w-[250px] border-r" />
                <Skeleton className="h-16 w-[200px] border-r" />
                <Skeleton className="h-16 w-[200px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (pagesError) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">Something went wrong</p>
          <p className="text-muted-foreground">{pagesError}</p>
          <Button onClick={onRefetch} variant="outline">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-background ${resizingFields.size > 0 ? 'resize-mode' : ''}`}>
      {/* Header with improved styling */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-foreground">Table View</h3>
          <div className="px-2 py-1 bg-muted rounded-md">
            <span className="text-sm font-medium text-muted-foreground">
              {pagesWithProperties.length} {pagesWithProperties.length === 1 ? 'row' : 'rows'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={onCreateRow}
            className="gap-2 bg-primary hover:bg-primary/90"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add Row
          </Button>
          {onShowManageProperties && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowManageProperties}
              className="gap-2 border-border/60 hover:bg-muted/50"
            >
              <Settings className="h-4 w-4" />
              Manage Properties
            </Button>
          )}
        </div>
      </div>

      {/* Table container with fixed layout and consistent width */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="w-full" style={{ minWidth: `${totalTableWidth}px` }}>
          <Table className="border-collapse" style={{ 
            tableLayout: 'fixed',
            width: `${totalTableWidth}px`
          }}>
            <DatabaseTableHeader
              fields={fields}
              sortRules={sortRules}
              onSort={handleSort}
              onFieldsChange={onFieldsChange}
              onFieldReorder={onFieldReorder}
              columnWidths={columnWidths}
              onColumnResize={updateColumnWidth}
              onResizeStateChange={handleResizeStateChange}
            />
            <DatabaseTableBody
              pagesWithProperties={pagesWithProperties}
              fields={fields}
              onTitleUpdate={onTitleUpdate}
              onPropertyUpdate={onPropertyUpdate}
              onDeleteRow={onDeleteRow}
              onCreateRow={onCreateRow}
              workspaceId={workspaceId}
              selectedRows={selectedRows}
              onRowSelect={handleRowSelect}
              onSelectAll={handleSelectAll}
              showNewRow={true}
              columnWidths={columnWidths}
              resizingFields={resizingFields}
            />
          </Table>
        </div>
      </div>
    </div>
  );
}
