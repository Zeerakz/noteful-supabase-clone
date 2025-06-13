
import React from 'react';
import { DatabaseColumnHeader } from './DatabaseColumnHeader';
import { DatabaseField } from '@/types/database';
import { SortRule } from '@/components/database/SortingModal';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

interface DatabaseTableHeaderProps {
  fields: DatabaseField[];
  sortRules: SortRule[];
  onSort: (fieldId: string, direction: 'asc' | 'desc') => void;
  onFieldsChange?: () => void;
  onFieldReorder?: (draggedFieldId: string, targetFieldId: string, position: 'before' | 'after') => void;
  getColumnWidth: (fieldId: string) => number;
  onColumnResize?: (fieldId: string, width: number) => void;
}

export function DatabaseTableHeader({ 
  fields, 
  sortRules, 
  onSort, 
  onFieldsChange,
  onFieldReorder,
  getColumnWidth,
  onColumnResize
}: DatabaseTableHeaderProps) {
  return (
    <TableHeader className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm">
      <TableRow className="hover:bg-transparent border-b-2 border-border">
        {/* Selection Column */}
        <TableHead 
          className="p-3 bg-card/95 border-r border-border/40 text-center"
          style={{ width: `${getColumnWidth('checkbox')}px` }}
        >
          <Checkbox className="opacity-50" />
        </TableHead>

        {/* Title Column */}
        <TableHead 
          className="p-0 bg-card/95 border-r border-border/40"
          style={{ width: `${getColumnWidth('title')}px` }}
        >
          <DatabaseColumnHeader
            field={{
              id: 'title',
              name: 'Title',
              type: 'text',
              database_id: '',
              pos: 0,
              created_by: '',
              created_at: '',
              updated_at: ''
            }}
            sortRules={sortRules}
            onSort={onSort}
            onResize={onColumnResize}
            width={getColumnWidth('title')}
            className="border-b-0"
          />
        </TableHead>

        {/* Field Columns */}
        {fields.map((field) => (
          <TableHead 
            key={field.id} 
            className="p-0 bg-card/95 border-r border-border/40 last:border-r-0"
            style={{ width: `${getColumnWidth(field.id)}px` }}
          >
            <DatabaseColumnHeader
              field={field}
              sortRules={sortRules}
              onSort={onSort}
              onFieldsChange={onFieldsChange}
              onFieldReorder={onFieldReorder}
              onResize={onColumnResize}
              width={getColumnWidth(field.id)}
              isDraggable={true}
              className="border-b-0"
            />
          </TableHead>
        ))}

        {/* Actions Column */}
        <TableHead 
          className="p-3 bg-card/95 text-center"
          style={{ width: `${getColumnWidth('actions')}px` }}
        >
          <div className="text-xs font-medium text-muted-foreground">
            •••
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
