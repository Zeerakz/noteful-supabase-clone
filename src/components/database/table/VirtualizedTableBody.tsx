
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
  getColumnWidth: (fieldId: string) => number;
  workspaceId: string;
}

export function VirtualizedTableBody({
  pages,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  isLoading = false,
  getColumnWidth,
  workspaceId
}: VirtualizedTableBodyProps) {
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
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index} className="border-b">
              <td className="p-3" style={{ width: '48px' }}>
                <div className="h-4 bg-muted rounded animate-pulse" />
              </td>
              <td className="p-3" style={{ width: `${getColumnWidth('title')}px` }}>
                <div className="h-4 bg-muted rounded animate-pulse" />
              </td>
              {fields.map((field) => (
                <td key={field.id} className="p-3" style={{ width: `${getColumnWidth(field.id)}px` }}>
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </td>
              ))}
              <td className="p-3" style={{ width: '64px' }}>
                <div className="h-4 bg-muted rounded animate-pulse" />
              </td>
            </tr>
          ))}
        </TableBody>
      </Table>
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
            getColumnWidth={getColumnWidth}
            workspaceId={workspaceId}
            isEvenRow={index % 2 === 0}
          />
        ))}
      </TableBody>
    </Table>
  );
}
