
import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DatabaseTableRow } from './DatabaseTableRow';
import { DatabaseField } from '@/types/database';

interface PageWithProperties {
  id: string;
  title: string;
  properties: Record<string, string>;
}

interface VirtualizedTableBodyProps {
  pages: PageWithProperties[];
  fields: DatabaseField[];
  onTitleUpdate: (pageId: string, newTitle: string) => void;
  onPropertyUpdate: (pageId: string, fieldId: string, value: string) => void;
  onDeleteRow: (pageId: string) => void;
  isLoading?: boolean;
  parentRef: React.RefObject<HTMLDivElement>;
}

export function VirtualizedTableBody({
  pages,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  isLoading = false,
  parentRef
}: VirtualizedTableBodyProps) {
  const virtualizer = useVirtualizer({
    count: isLoading ? 10 : pages.length, // Show 10 skeleton rows while loading
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height in pixels
    overscan: 5, // Render 5 extra rows outside viewport for smooth scrolling
  });

  if (pages.length === 0 && !isLoading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell 
            colSpan={fields.length + 2} 
            className="text-center py-8 text-muted-foreground"
          >
            No rows in this database yet. Click "Add Row" to create your first entry.
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const page = pages[virtualItem.index];
        const isSkeletonRow = isLoading || !page;

        return (
          <TableRow
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {isSkeletonRow ? (
              <>
                <TableCell className="font-medium">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                {fields.map((field) => (
                  <TableCell key={field.id}>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                ))}
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded" />
                </TableCell>
              </>
            ) : (
              <DatabaseTableRow
                page={page}
                fields={fields}
                onTitleUpdate={onTitleUpdate}
                onPropertyUpdate={onPropertyUpdate}
                onDeleteRow={onDeleteRow}
              />
            )}
          </TableRow>
        );
      })}
      {/* Virtual spacer to maintain correct scrollable height */}
      <TableRow style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <TableCell colSpan={fields.length + 2} className="p-0 border-0" />
      </TableRow>
    </TableBody>
  );
}
