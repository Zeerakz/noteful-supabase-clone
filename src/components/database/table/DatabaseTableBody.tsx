
import React from 'react';
import { TableBody } from '@/components/ui/table';
import { DatabaseTableRow } from './DatabaseTableRow';
import { NewTableRow } from './NewTableRow';
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
  onCreateRow?: () => void;
  workspaceId: string;
  getColumnWidth: (fieldId: string) => number;
  selectedRows?: Set<string>;
  onRowSelect?: (pageId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  showNewRow?: boolean;
  resizingFields?: Set<string>;
}

export function DatabaseTableBody({
  pagesWithProperties,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  onCreateRow,
  workspaceId,
  getColumnWidth,
  selectedRows = new Set(),
  onRowSelect,
  onSelectAll,
  showNewRow = true,
  resizingFields = new Set()
}: DatabaseTableBodyProps) {
  return (
    <TableBody>
      {pagesWithProperties.length === 0 && !showNewRow ? (
        <tr>
          <td 
            colSpan={fields.length + 3} 
            className="text-center py-8 text-muted-foreground"
          >
            No rows in this database yet. Click "Add Row" to create your first entry.
          </td>
        </tr>
      ) : (
        <>
          {pagesWithProperties.map((page, index) => (
            <DatabaseTableRow
              key={page.id}
              page={page}
              fields={fields}
              onTitleUpdate={onTitleUpdate}
              onPropertyUpdate={onPropertyUpdate}
              onDeleteRow={onDeleteRow}
              workspaceId={workspaceId}
              getColumnWidth={getColumnWidth}
              isSelected={selectedRows.has(page.id)}
              onSelect={onRowSelect}
              isEvenRow={index % 2 === 0}
              resizingFields={resizingFields}
            />
          ))}
          
          {/* New row for quick item creation */}
          {showNewRow && onCreateRow && (
            <NewTableRow
              fields={fields}
              onCreateRow={onCreateRow}
              getColumnWidth={getColumnWidth}
              isEvenRow={pagesWithProperties.length % 2 === 0}
              resizingFields={resizingFields}
            />
          )}
        </>
      )}
    </TableBody>
  );
}
