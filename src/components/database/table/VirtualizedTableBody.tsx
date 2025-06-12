
import React from 'react';
import {
  Table,
  TableBody,
} from '@/components/ui/table';
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
  columnWidths?: Record<string, number>;
  workspaceId: string;
}

export function VirtualizedTableBody({
  pages,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  isLoading = false,
  columnWidths = {},
  workspaceId
}: VirtualizedTableBodyProps) {
  if (isLoading) {
    return (
      <Table>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index} className="border-b">
              <td className="p-4 w-[200px]">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </td>
              {fields.map((field) => (
                <td key={field.id} className="p-4 min-w-[150px]">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </td>
              ))}
              <td className="p-4 w-[50px]">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </td>
            </tr>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableBody>
        {pages.map((page) => (
          <DatabaseTableRow
            key={page.id}
            page={page}
            fields={fields}
            onTitleUpdate={onTitleUpdate}
            onPropertyUpdate={onPropertyUpdate}
            onDeleteRow={onDeleteRow}
            columnWidths={columnWidths}
            workspaceId={workspaceId}
          />
        ))}
      </TableBody>
    </Table>
  );
}
