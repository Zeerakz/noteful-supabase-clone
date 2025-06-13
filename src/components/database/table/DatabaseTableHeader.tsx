
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

  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent border-b-2 border-border">
        {/* Checkbox Header */}
        <TableHead 
          className="checkbox-cell p-0 border-r border-border/10"
          style={{ width: '48px' }}
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
          className="p-0 border-r border-border/10"
          style={{ width: `${getColumnWidth('title')}px` }}
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
          return (
            <TableHead
              key={field.id}
              className={`p-0 ${!isLastField ? 'border-r border-border/10' : ''}`}
              style={{ width: `${getColumnWidth(field.id)}px` }}
            >
              <div className="table-header-content">
                <DatabaseColumnHeader
                  field={field}
                  sortRules={sortRules}
                  onSort={onSort}
                  onFieldReorder={onFieldReorder}
                  onStartResize={onStartResize}
                  onEndResize={onEndResize}
                  onResize={onResize}
                  isResizing={resizingFields.has(field.id)}
                  onFieldsChange={onFieldsChange}
                />
              </div>
            </TableHead>
          );
        })}

        {/* Actions Header */}
        <TableHead 
          className="actions-cell p-0"
          style={{ width: '64px' }}
        >
          <div className="table-header-content justify-center">
            <span className="text-column-header">ACTIONS</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
