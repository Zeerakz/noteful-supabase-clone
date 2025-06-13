
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
  onResize
}: DatabaseTableHeaderProps) {
  const allSelected = selectedRows.size === totalRows && totalRows > 0;
  const someSelected = selectedRows.size > 0 && selectedRows.size < totalRows;

  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        {/* Checkbox Header - Grid Aligned */}
        <TableHead 
          className="checkbox-cell p-0"
          style={{ width: '48px' }}
        >
          <div className="table-header-content justify-center">
            <Checkbox
              checked={allSelected}
              ref={(ref) => {
                if (ref) ref.indeterminate = someSelected;
              }}
              onCheckedChange={onSelectAll}
              className="transition-opacity duration-200"
            />
          </div>
        </TableHead>

        {/* Title Header - Clean Typography */}
        <TableHead 
          className="hairline-vertical p-0"
          style={{ width: `${getColumnWidth('title')}px` }}
        >
          <div className="table-header-content">
            <DatabaseColumnHeader
              field={{ id: 'title', name: 'Title', type: 'title' } as DatabaseField}
              sortRules={sortRules}
              onSort={onSort}
              onStartResize={onStartResize}
              onEndResize={onEndResize}
              onResize={onResize}
              isResizing={resizingFields.has('title')}
            />
          </div>
        </TableHead>

        {/* Field Headers - Minimal Grid Structure */}
        {fields.map((field, index) => {
          const isLastField = index === fields.length - 1;
          return (
            <TableHead
              key={field.id}
              className={`p-0 ${!isLastField ? 'hairline-vertical' : ''}`}
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
                />
              </div>
            </TableHead>
          );
        })}

        {/* Actions Header - Minimal */}
        <TableHead 
          className="actions-cell p-0"
          style={{ width: '64px' }}
        >
          <div className="table-header-content justify-center">
            <span className="text-column-header">Actions</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
