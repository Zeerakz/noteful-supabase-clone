
import React from 'react';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { DatabaseTableRow } from './DatabaseTableRow';
import { DatabaseField } from '@/types/database';

interface PageWithProperties {
  id: string;
  title: string;
  properties: Record<string, string>;
}

interface DatabaseTableBodyProps {
  pagesWithProperties: PageWithProperties[];
  fields: DatabaseField[];
  onTitleUpdate: (pageId: string, newTitle: string) => void;
  onPropertyUpdate: (pageId: string, fieldId: string, value: string) => void;
  onDeleteRow: (pageId: string) => void;
  workspaceId: string;
  columnWidths?: Record<string, number>;
}

export function DatabaseTableBody({
  pagesWithProperties,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  workspaceId,
  columnWidths
}: DatabaseTableBodyProps) {
  return (
    <TableBody>
      {pagesWithProperties.length === 0 ? (
        <TableRow>
          <TableCell 
            colSpan={fields.length + 2} 
            className="text-center py-8 text-muted-foreground"
          >
            No rows in this database yet. Click "Add Row" to create your first entry.
          </TableCell>
        </TableRow>
      ) : (
        pagesWithProperties.map((page) => (
          <TableRow key={page.id}>
            <DatabaseTableRow
              page={page}
              fields={fields}
              onTitleUpdate={onTitleUpdate}
              onPropertyUpdate={onPropertyUpdate}
              onDeleteRow={onDeleteRow}
              workspaceId={workspaceId}
            />
          </TableRow>
        ))
      )}
    </TableBody>
  );
}
