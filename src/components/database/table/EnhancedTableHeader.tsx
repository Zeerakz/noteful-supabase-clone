
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatabaseColumnHeader } from './DatabaseColumnHeader';
import { DatabaseField } from '@/types/database';
import { SortRule } from '@/components/database/SortingModal';

interface EnhancedTableHeaderProps {
  fields: DatabaseField[];
  sortRules: SortRule[];
  onSort: (fieldId: string, direction: 'asc' | 'desc') => void;
  onColumnResize?: (fieldId: string, width: number) => void;
  columnWidths?: Record<string, number>;
  stickyHeader?: boolean;
}

export function EnhancedTableHeader({
  fields,
  sortRules,
  onSort,
  onColumnResize,
  columnWidths = {},
  stickyHeader = false
}: EnhancedTableHeaderProps) {
  return (
    <TableHeader className={stickyHeader ? 'sticky top-0 z-10' : ''}>
      <TableRow className="hover:bg-transparent">
        {/* Title Column */}
        <TableHead className="w-[200px] sticky left-0 bg-muted/30 border-r border-border">
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
            width={columnWidths['title'] || 200}
            className="border-b-0"
          />
        </TableHead>

        {/* Dynamic Field Columns */}
        {fields.map((field, index) => (
          <TableHead 
            key={field.id} 
            className="min-w-[150px] relative"
            style={{ width: columnWidths[field.id] ? `${columnWidths[field.id]}px` : undefined }}
          >
            <DatabaseColumnHeader
              field={field}
              sortRules={sortRules}
              onSort={onSort}
              onResize={onColumnResize}
              width={columnWidths[field.id] || 150}
              className="border-b-0"
            />
          </TableHead>
        ))}

        {/* Actions Column */}
        <TableHead className="w-[50px]">
          <div className="flex items-center justify-center px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border bg-muted/30">
            Actions
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
