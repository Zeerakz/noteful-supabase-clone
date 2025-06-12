
import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TableCell } from '@/components/ui/table';
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
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No rows in this database yet. Click "Add Row" to create your first entry.
      </div>
    );
  }

  return (
    <div
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const page = pages[virtualItem.index];
        const isSkeletonRow = isLoading || !page;

        return (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid hsl(var(--border))',
            }}
            className="hover:bg-muted/50"
          >
            {/* Title cell */}
            <div className="w-[200px] px-4 py-3 font-medium flex-shrink-0">
              {isSkeletonRow ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <DatabaseTableRow
                  page={page}
                  fields={[]}
                  onTitleUpdate={onTitleUpdate}
                  onPropertyUpdate={onPropertyUpdate}
                  onDeleteRow={onDeleteRow}
                  titleOnly
                />
              )}
            </div>
            
            {/* Field cells */}
            {fields.map((field) => (
              <div key={field.id} className="min-w-[150px] px-4 py-3 flex-shrink-0">
                {isSkeletonRow ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <DatabaseTableRow
                    page={page}
                    fields={[field]}
                    onTitleUpdate={onTitleUpdate}
                    onPropertyUpdate={onPropertyUpdate}
                    onDeleteRow={onDeleteRow}
                    fieldOnly={field.id}
                  />
                )}
              </div>
            ))}
            
            {/* Delete button cell */}
            <div className="w-[50px] px-4 py-3 flex-shrink-0 flex justify-center">
              {isSkeletonRow ? (
                <Skeleton className="h-8 w-8 rounded" />
              ) : (
                <DatabaseTableRow
                  page={page}
                  fields={fields}
                  onTitleUpdate={onTitleUpdate}
                  onPropertyUpdate={onPropertyUpdate}
                  onDeleteRow={onDeleteRow}
                  deleteOnly
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
