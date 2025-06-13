
import React, { useRef, useMemo } from 'react';
import {
  Table,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VirtualizedTableBody } from './VirtualizedTableBody';
import { EnhancedTableHeader } from './EnhancedTableHeader';
import { useColumnResizing } from './hooks/useColumnResizing';
import { useTableSorting } from './hooks/useTableSorting';
import { DatabaseField } from '@/types/database';
import { SortRule } from '@/components/database/SortingModal';
import { useVirtualScrolling } from '@/hooks/useVirtualScrolling';

interface PageWithProperties {
  id: string;
  title: string;
  properties: Record<string, string>;
}

interface VirtualizedTableProps {
  pages: PageWithProperties[];
  fields: DatabaseField[];
  onTitleUpdate: (pageId: string, newTitle: string) => void;
  onPropertyUpdate: (pageId: string, fieldId: string, value: string) => void;
  onDeleteRow: (pageId: string) => void;
  isLoading?: boolean;
  maxHeight?: string;
  enableVirtualScrolling?: boolean;
  rowHeight?: number;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
  workspaceId: string;
}

export function VirtualizedTable({
  pages,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  isLoading = false,
  maxHeight = "600px",
  enableVirtualScrolling = false,
  rowHeight = 60,
  sortRules,
  setSortRules,
  workspaceId
}: VirtualizedTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerHeight = parseInt(maxHeight) || 600;

  const virtualScrolling = useVirtualScrolling({
    items: pages,
    itemHeight: rowHeight,
    containerHeight: containerHeight,
    overscan: 5
  });

  const { getColumnWidth, updateColumnWidth } = useColumnResizing({
    defaultWidths: {
      title: 280,
      ...fields.reduce((acc, field) => ({ ...acc, [field.id]: 200 }), {})
    }
  });

  const { handleSort } = useTableSorting({ sortRules, setSortRules });

  const displayPages = useMemo(() => {
    return enableVirtualScrolling && pages.length > 50 
      ? virtualScrolling.visibleItems 
      : pages;
  }, [enableVirtualScrolling, pages, virtualScrolling.visibleItems]);

  if (enableVirtualScrolling && pages.length > 50) {
    return (
      <div className="border-2 border-border rounded-lg overflow-hidden shadow-sm">
        {/* Fixed sticky header */}
        <div className="border-b-2 border-border bg-background/98 backdrop-blur-md sticky top-0 z-30 shadow-sm">
          <Table>
            <EnhancedTableHeader
              fields={fields}
              sortRules={sortRules}
              onSort={handleSort}
              onColumnResize={updateColumnWidth}
              getColumnWidth={getColumnWidth}
              stickyHeader={false}
            />
          </Table>
        </div>
        
        {/* Virtualized scrollable body */}
        <div 
          ref={containerRef}
          className="overflow-auto"
          style={{ height: maxHeight }}
          onScroll={virtualScrolling.handleScroll}
        >
          <div style={{ height: virtualScrolling.totalHeight, position: 'relative' }}>
            <div 
              style={{ 
                transform: `translateY(${virtualScrolling.offsetY}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0
              }}
            >
              <VirtualizedTableBody
                pages={displayPages}
                fields={fields}
                onTitleUpdate={onTitleUpdate}
                onPropertyUpdate={onPropertyUpdate}
                onDeleteRow={onDeleteRow}
                isLoading={isLoading}
                getColumnWidth={getColumnWidth}
                workspaceId={workspaceId}
              />
            </div>
          </div>
        </div>

        {/* Virtual scrolling info footer */}
        <div className="p-2 border-t-2 border-border bg-background/98 backdrop-blur-md text-xs text-muted-foreground shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
          Showing {virtualScrolling.startIndex + 1}-{virtualScrolling.endIndex + 1} of {pages.length} rows
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-border rounded-lg overflow-hidden shadow-sm">
      {/* Fixed sticky header */}
      <div className="border-b-2 border-border bg-background/98 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <Table>
          <EnhancedTableHeader
            fields={fields}
            sortRules={sortRules}
            onSort={handleSort}
            onColumnResize={updateColumnWidth}
            getColumnWidth={getColumnWidth}
            stickyHeader={false}
          />
        </Table>
      </div>
      
      {/* Scrollable body */}
      <ScrollArea style={{ height: maxHeight }}>
        <VirtualizedTableBody
          pages={displayPages}
          fields={fields}
          onTitleUpdate={onTitleUpdate}
          onPropertyUpdate={onPropertyUpdate}
          onDeleteRow={onDeleteRow}
          isLoading={isLoading}
          getColumnWidth={getColumnWidth}
          workspaceId={workspaceId}
        />
      </ScrollArea>
    </div>
  );
}
