
import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RefreshCw, AlertTriangle, Settings } from 'lucide-react';
import { VirtualizedTable } from './VirtualizedTable';
import { DatabaseTableHeader } from './DatabaseTableHeader';
import { NoFieldsEmptyState } from './DatabaseTableEmptyStates';
import { PaginationControls } from '../PaginationControls';
import { PerformanceMetrics } from '../PerformanceMetrics';
import { TableLoadingSkeleton } from '../LoadingStates';
import { DatabaseField } from '@/types/database';
import { SortRule } from '@/components/database/SortingModal';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  setCurrentPage: (page: number) => void;
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
  pagination?: PaginationData | null;
  totalPages: number;
  databaseId?: string;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
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
  setSortRules
}: DatabaseTableViewContentProps) {
  const [enableVirtualScrolling, setEnableVirtualScrolling] = useState(totalPages > 100);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(pagination?.itemsPerPage || 50);

  if (pagesLoading) {
    return (
      <div className="space-y-4">
        <DatabaseTableHeader onCreateRow={onCreateRow} />
        <TableLoadingSkeleton rowCount={10} fieldCount={fields.length} />
      </div>
    );
  }

  if (pagesError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{pagesError}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefetch}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DatabaseTableHeader onCreateRow={onCreateRow} />

      {/* Performance and Settings Controls */}
      {totalPages > 50 && (
        <Collapsible open={showPerformanceMetrics} onOpenChange={setShowPerformanceMetrics}>
          <div className="flex items-center justify-between p-2 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="virtual-scrolling"
                  checked={enableVirtualScrolling}
                  onCheckedChange={setEnableVirtualScrolling}
                />
                <Label htmlFor="virtual-scrolling" className="text-sm">
                  Virtual scrolling ({totalPages} rows)
                </Label>
              </div>
            </div>
            
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Performance
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent>
            {databaseId && (
              <PerformanceMetrics 
                viewType="table"
                databaseId={databaseId}
              />
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      <VirtualizedTable
        pages={pagesWithProperties}
        fields={fields}
        onTitleUpdate={onTitleUpdate}
        onPropertyUpdate={onPropertyUpdate}
        onDeleteRow={onDeleteRow}
        isLoading={pagesLoading}
        maxHeight="600px"
        enableVirtualScrolling={enableVirtualScrolling}
        rowHeight={60}
        sortRules={sortRules}
        setSortRules={setSortRules}
      />

      {/* Pagination Controls */}
      {pagination && (
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={pagination.goToPage}
          onItemsPerPageChange={(newSize) => {
            setItemsPerPage(newSize);
            // Note: This would need to be connected to the parent component
            // to actually change the items per page
          }}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
        />
      )}

      {fields.length === 0 && <NoFieldsEmptyState />}
    </div>
  );
}
