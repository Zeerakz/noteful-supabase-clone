import React, { useState, useCallback } from 'react';
import { DatabaseField, PageProperty } from '@/types/database';
import { DatabaseTableHeader } from './DatabaseTableHeader';
import { DatabaseTableBody } from './DatabaseTableBody';
import { Table, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { Settings } from 'lucide-react';
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
  onItemsPerPageChange,
  userProfiles = [],
  allFields = []
}: DatabaseTableViewContentProps & {
  userProfiles?: any[];
  allFields?: DatabaseField[];
}) {
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [resizingFields, setResizingFields] = useState<Set<string>>(new Set());

  // Column resizing functionality with consistent width management
  const {
    getColumnWidth,
    updateColumnWidth,
    resetColumnWidth,
    resetAllWidths
  } = useColumnResizing({
    defaultWidths: {
      checkbox: 48,
      title: 280,
      actions: 64,
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

  const handleStartResize = useCallback((fieldId: string) => {
    setResizingFields(prev => new Set(prev).add(fieldId));
  }, []);

  const handleEndResize = useCallback(() => {
    setResizingFields(new Set());
  }, []);

  // Calculate total width for the table with consistent approach
  const calculateTotalWidth = () => {
    const checkboxWidth = getColumnWidth('checkbox');
    const titleWidth = getColumnWidth('title');
    const fieldsWidth = fields.reduce((acc, field) => acc + getColumnWidth(field.id), 0);
    const actionsWidth = getColumnWidth('actions');
    return checkboxWidth + titleWidth + fieldsWidth + actionsWidth;
  };

  const totalTableWidth = calculateTotalWidth();

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

  const renderRows = () => {
    return pagesWithProperties.map((page, index) => (
      <DatabaseTableRow
        key={page.id}
        page={page}
        fields={fields}
        onTitleUpdate={onTitleUpdate}
        onPropertyUpdate={onPropertyUpdate}
        onDeleteRow={onDeleteRow}
        getColumnWidth={getColumnWidth}
        workspaceId={workspaceId}
        isSelected={selectedRows.has(page.id)}
        onSelect={handleRowSelect}
        isEvenRow={index % 2 === 0}
        resizingFields={resizingFields}
        userProfiles={userProfiles}
        allFields={allFields}
      />
    ));
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header with improved styling - Fixed height */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-foreground">Table View</h3>
          <div className="px-2 py-1 bg-muted rounded-md">
            <span className="text-sm font-medium text-muted-foreground">
              {pagesWithProperties.length} {pagesWithProperties.length === 1 ? 'row' : 'rows'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Table container with native scrolling - uses remaining height */}
      <div className="flex-1 min-h-0 overflow-auto bg-background">
        <div 
          className="relative"
          style={{ 
            minWidth: `${totalTableWidth}px`,
            width: 'max-content'
          }}
        >
          <Table className="w-full table-fixed" style={{ width: `${totalTableWidth}px` }}>
            {/* Sticky Header */}
            <DatabaseTableHeader
              fields={fields}
              sortRules={sortRules}
              onSort={handleSort}
              onFieldsChange={onFieldsChange}
              onFieldReorder={onFieldReorder}
              getColumnWidth={getColumnWidth}
              selectedRows={selectedRows}
              totalRows={pagesWithProperties.length}
              onSelectAll={handleSelectAll}
              onColumnResize={updateColumnWidth}
              resizingFields={resizingFields}
              onStartResize={handleStartResize}
              onEndResize={handleEndResize}
              onResize={updateColumnWidth}
            />
            
            {/* Table Body */}
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
              getColumnWidth={getColumnWidth}
              resizingFields={resizingFields}
            />
          </Table>
        </div>
      </div>
    </div>
  );
}
