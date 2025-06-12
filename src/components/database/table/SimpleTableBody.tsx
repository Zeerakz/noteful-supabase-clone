
import React from 'react';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DatabaseTableRow } from './DatabaseTableRow';
import { DatabaseField } from '@/types/database';

interface PageWithProperties {
  id: string;
  title: string;
  properties: Record<string, string>;
}

interface SimpleTableBodyProps {
  pages: PageWithProperties[];
  fields: DatabaseField[];
  onTitleUpdate: (pageId: string, newTitle: string) => void;
  onPropertyUpdate: (pageId: string, fieldId: string, value: string) => void;
  onDeleteRow: (pageId: string) => void;
  isLoading?: boolean;
  workspaceId: string;
}

export function SimpleTableBody({
  pages,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  isLoading = false,
  workspaceId
}: SimpleTableBodyProps) {
  if (isLoading) {
    return (
      <Table>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="w-[200px]">
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No rows in this database yet. Click "Add Row" to create your first entry.
      </div>
    );
  }

  return (
    <Table>
      <TableBody>
        {pages.map((page) => (
          <TableRow key={page.id} className="hover:bg-muted/50">
            <DatabaseTableRow
              page={page}
              fields={fields}
              onTitleUpdate={onTitleUpdate}
              onPropertyUpdate={onPropertyUpdate}
              onDeleteRow={onDeleteRow}
              workspaceId={workspaceId}
            />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
