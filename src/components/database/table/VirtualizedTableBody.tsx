
import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table';
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
    count: isLoading ? 10 : pages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  if (pages.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No rows in this database yet. Click "Add Row" to create your first entry.
      </div>
    );
  }

  return (
    <Table>
      <TableBody
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
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
                display: 'flex',
                alignItems: 'center',
              }}
              className="hover:bg-muted/50"
            >
              {isSkeletonRow ? (
                <>
                  <TableCell className="w-[200px] font-medium">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  {fields.map((field) => (
                    <TableCell key={field.id} className="min-w-[150px]">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                  <TableCell className="w-[50px]">
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
      </TableBody>
    </Table>
  );
}
