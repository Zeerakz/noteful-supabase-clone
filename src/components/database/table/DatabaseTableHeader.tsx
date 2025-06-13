
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DatabaseColumnHeader } from './DatabaseColumnHeader';
import { DatabaseField } from '@/types/database';
import { SortRule } from '../SortingModal';

interface DatabaseTableHeaderProps {
  fields: DatabaseField[];
  sortRules: SortRule[];
  onSort: (fieldId: string, direction: 'asc' | 'desc') => void;
  getColumnWidth: (fieldId: string) => number;
  selectedRows: Set<string>;
  totalRows: number;
  onSelectAll: (selected: boolean) => void;
  onFieldReorder?: (draggedFieldId: string, targetFieldId: string, position: 'before' | 'after') => void;
  resizingFields?: Set<string>;
  onStartResize?: (fieldId: string) => void;
  onEndResize?: () => void;
  onResize?: (fieldId: string, width: number) => void;
  onFieldsChange?: () => void;
  onColumnResize?: (fieldId: string, width: number) => void;
}

export function DatabaseTableHeader({
  fields,
  sortRules,
  onSort,
  getColumnWidth,
  selectedRows,
  totalRows,
  onSelectAll,
  onFieldReorder,
  resizingFields = new Set(),
  onStartResize,
  onEndResize,
  onResize,
  onFieldsChange,
  onColumnResize
}: DatabaseTableHeaderProps) {
  const allSelected = selectedRows.size === totalRows && totalRows > 0;
  const someSelected = selectedRows.size > 0 && selectedRows.size < totalRows;

  // Use onColumnResize if available, otherwise fall back to onResize
  const handleResize = onColumnResize || onResize;

  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent hairline-divider">
        {/* Checkbox Header */}
        <TableHead 
          className="checkbox-cell p-0 hairline-vertical"
          style={{ width: '48px', minWidth: '48px', maxWidth: '48px' }}
        >
          <div className="table-header-content justify-center">
            <Checkbox
              checked={allSelected}
              ref={(ref) => {
                if (ref) {
                  const input = ref.querySelector('input');
                  if (input) input.indeterminate = someSelected;
                }
              }}
              onCheckedChange={onSelectAll}
              className="transition-opacity duration-200"
            />
          </div>
        </TableHead>

        {/* Title Header */}
        <TableHead 
          className="p-0 hairline-vertical"
          style={{ 
            width: `${getColumnWidth('title')}px`,
            minWidth: `${getColumnWidth('title')}px`,
            maxWidth: `${getColumnWidth('title')}px`
          }}
        >
          <div className="table-header-content">
            <div className="flex items-center gap-2 w-full">
              <span className="text-column-header">TITLE</span>
            </div>
          </div>
        </TableHead>

        {/* Field Headers */}
        {fields.map((field, index) => {
          const isLastField = index === fields.length - 1;
          const columnWidth = getColumnWidth(field.id);
          return (
            <TableHead
              key={field.id}
              className={`p-0 ${!isLastField ? 'hairline-vertical' : ''}`}
              style={{ 
                width: `${columnWidth}px`,
                minWidth: `${columnWidth}px`,
                maxWidth: `${columnWidth}px`
              }}
            >
              <div className="table-header-content">
                <DatabaseColumnHeader
                  field={field}
                  sortRules={sortRules}
                  onSort={onSort}
                  onFieldReorder={onFieldReorder}
                  onStartResize={onStartResize}
                  onEndResize={onEndResize}
                  onResize={handleResize}
                  isResizing={resizingFields.has(field.id)}
                  onFieldsChange={onFieldsChange}
                  width={columnWidth}
                  isResizable={true}
                  isDraggable={true}
                />
              </div>
            </TableHead>
          );
        })}

        {/* Actions Header */}
        <TableHead 
          className="actions-cell p-0"
          style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}
        >
          <div className="table-header-content justify-center">
            <span className="text-column-header">ACTIONS</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
