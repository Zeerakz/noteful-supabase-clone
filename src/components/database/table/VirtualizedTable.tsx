
import React, { useRef, useMemo } from 'react';
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VirtualizedTableBody } from './VirtualizedTableBody';
import { DatabaseField } from '@/types/database';
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
  rowHeight = 60
}: VirtualizedTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerHeight = parseInt(maxHeight) || 600;

  const virtualScrolling = useVirtualScrolling({
    items: pages,
    itemHeight: rowHeight,
    containerHeight: containerHeight,
    overscan: 5
  });

  const displayPages = useMemo(() => {
    return enableVirtualScrolling && pages.length > 50 
      ? virtualScrolling.visibleItems 
      : pages;
  }, [enableVirtualScrolling, pages, virtualScrolling.visibleItems]);

  if (enableVirtualScrolling && pages.length > 50) {
    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Fixed header */}
        <div className="border-b bg-muted/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] sticky left-0 bg-muted/50">
                  Title
                </TableHead>
                {fields.map((field) => (
                  <TableHead key={field.id} className="min-w-[150px]">
                    {field.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({field.type})
                    </span>
                  </TableHead>
                ))}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
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
              />
            </div>
          </div>
        </div>

        {/* Virtual scrolling info */}
        <div className="p-2 border-t bg-muted/20 text-xs text-muted-foreground">
          Showing {virtualScrolling.startIndex + 1}-{virtualScrolling.endIndex + 1} of {pages.length} rows
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Fixed header */}
      <div className="border-b bg-muted/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] sticky left-0 bg-muted/50">
                Title
              </TableHead>
              {fields.map((field) => (
                <TableHead key={field.id} className="min-w-[150px]">
                  {field.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({field.type})
                  </span>
                </TableHead>
              ))}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
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
        />
      </ScrollArea>
    </div>
  );
}
