
import React, { useRef, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
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
  maxHeight = "none",
  enableVirtualScrolling = false,
  rowHeight = 60,
  sortRules,
  setSortRules,
  workspaceId
}: VirtualizedTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerHeight = maxHeight === "none" ? window.innerHeight : parseInt(maxHeight) || 600;

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

  // Calculate total table width for consistent layout
  const calculateTableWidth = () => {
    const checkboxWidth = 48;
    const titleWidth = getColumnWidth('title');
    const fieldsWidth = fields.reduce((sum, field) => sum + getColumnWidth(field.id), 0);
    const actionsWidth = 64;
    return checkboxWidth + titleWidth + fieldsWidth + actionsWidth;
  };

  const totalTableWidth = calculateTableWidth();

  return (
    <div className="flex flex-col bg-background border-2 border-border rounded-lg shadow-sm">
      {/* Fixed sticky header */}
      <div className="shrink-0 border-b-2 border-border bg-background/98 backdrop-blur-md sticky top-16 z-20 shadow-sm">
        <Table className="table-fixed" style={{ width: `${totalTableWidth}px` }}>
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
      
      {/* Table body without internal scrolling - uses page scroll */}
      <div className="flex-1">
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

      {/* Virtual scrolling info footer if enabled */}
      {enableVirtualScrolling && pages.length > 50 && (
        <div className="shrink-0 p-2 border-t-2 border-border bg-background/98 backdrop-blur-md text-xs text-muted-foreground shadow-[0_-2px_4px_rgba(0,0,0,0.05)] sticky bottom-0 z-20">
          Showing {virtualScrolling.startIndex + 1}-{virtualScrolling.endIndex + 1} of {pages.length} rows
        </div>
      )}
    </div>
  );
}
