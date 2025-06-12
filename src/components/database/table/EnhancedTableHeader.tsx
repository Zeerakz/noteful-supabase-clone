
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatabaseColumnHeader } from './DatabaseColumnHeader';
import { DatabaseField } from '@/types/database';
import { SortRule } from '@/components/database/SortingModal';
import { MoreHorizontal } from 'lucide-react';

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
    <TableHeader className={`${stickyHeader ? 'sticky top-0 z-20' : ''} bg-background/95 backdrop-blur-sm`}>
      <TableRow className="hover:bg-transparent border-none">
        {/* Title Column */}
        <TableHead className="w-[250px] sticky left-0 bg-background/95 backdrop-blur-sm border-r border-border/60 p-0 shadow-sm">
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
            width={columnWidths['title'] || 250}
            className="border-b-0"
          />
        </TableHead>

        {/* Dynamic Field Columns */}
        {fields.map((field) => (
          <TableHead 
            key={field.id} 
            className="min-w-[160px] relative p-0"
            style={{ width: columnWidths[field.id] ? `${columnWidths[field.id]}px` : '160px' }}
          >
            <DatabaseColumnHeader
              field={field}
              sortRules={sortRules}
              onSort={onSort}
              onResize={onColumnResize}
              width={columnWidths[field.id] || 160}
              className="border-b-0"
            />
          </TableHead>
        ))}

        {/* Actions Column */}
        <TableHead className="w-[60px] p-0">
          <div className="flex items-center justify-center px-3 py-3 text-xs font-semibold text-muted-foreground border-b-2 border-border/60 bg-background/95 backdrop-blur-sm">
            <MoreHorizontal className="h-4 w-4" />
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
