
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
  getColumnWidth: (fieldId: string) => number;
}

export function SimpleTableBody({
  pages,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  isLoading = false,
  workspaceId,
  getColumnWidth
}: SimpleTableBodyProps) {
  // Calculate total table width for consistent layout
  const calculateTableWidth = () => {
    const checkboxWidth = 48;
    const titleWidth = getColumnWidth('title');
    const fieldsWidth = fields.reduce((sum, field) => sum + getColumnWidth(field.id), 0);
    const actionsWidth = 64;
    return checkboxWidth + titleWidth + fieldsWidth + actionsWidth;
  };

  const totalTableWidth = calculateTableWidth();

  if (isLoading) {
    return (
      <Table className="table-fixed" style={{ width: `${totalTableWidth}px` }}>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell style={{ width: '48px' }}>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell style={{ width: `${getColumnWidth('title')}px` }}>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              {fields.map((field) => (
                <TableCell key={field.id} style={{ width: `${getColumnWidth(field.id)}px` }}>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              ))}
              <TableCell style={{ width: '64px' }}>
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
    <Table className="table-fixed" style={{ width: `${totalTableWidth}px` }}>
      <TableBody>
        {pages.map((page, index) => (
          <DatabaseTableRow
            key={page.id}
            page={page}
            fields={fields}
            onTitleUpdate={onTitleUpdate}
            onPropertyUpdate={onPropertyUpdate}
            onDeleteRow={onDeleteRow}
            workspaceId={workspaceId}
            getColumnWidth={getColumnWidth}
            isEvenRow={index % 2 === 0}
          />
        ))}
      </TableBody>
    </Table>
  );
}
