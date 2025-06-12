
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
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
  selectedCount?: number;
  totalCount?: number;
  onSelectAll?: (selected: boolean) => void;
}

export function EnhancedTableHeader({
  fields,
  sortRules,
  onSort,
  onColumnResize,
  columnWidths = {},
  stickyHeader = false,
  selectedCount = 0,
  totalCount = 0,
  onSelectAll
}: EnhancedTableHeaderProps) {
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (onSelectAll && typeof checked === 'boolean') {
      onSelectAll(checked);
    }
  };

  return (
    <TableHeader 
      className={`
        ${stickyHeader ? 'sticky top-0 z-30' : ''} 
        bg-background/98 backdrop-blur-md border-b-2 border-border
        shadow-sm
      `}
    >
      <TableRow className="hover:bg-transparent border-none">
        {/* Selection Column */}
        <TableHead className="w-[48px] p-2 sticky left-0 z-40 bg-background/98 backdrop-blur-md border-r border-border/80 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-center">
            <Checkbox
              checked={isPartiallySelected ? 'indeterminate' : isAllSelected}
              onCheckedChange={handleSelectAll}
              className="transition-opacity duration-200"
            />
          </div>
        </TableHead>

        {/* Title Column */}
        <TableHead className="w-[250px] sticky left-[48px] z-40 bg-background/98 backdrop-blur-md border-r border-border/80 p-0 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
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
            className="border-b-0 bg-background/98"
          />
        </TableHead>

        {/* Dynamic Field Columns */}
        {fields.map((field) => (
          <TableHead 
            key={field.id} 
            className="min-w-[160px] relative p-0 bg-background/98 backdrop-blur-md"
            style={{ width: columnWidths[field.id] ? `${columnWidths[field.id]}px` : '160px' }}
          >
            <DatabaseColumnHeader
              field={field}
              sortRules={sortRules}
              onSort={onSort}
              onResize={onColumnResize}
              width={columnWidths[field.id] || 160}
              className="border-b-0 bg-background/98"
            />
          </TableHead>
        ))}

        {/* Actions Column */}
        <TableHead className="w-[60px] p-0 bg-background/98 backdrop-blur-md">
          <div className="flex items-center justify-center px-3 py-3 text-xs font-semibold text-muted-foreground bg-background/98 backdrop-blur-md border-b-2 border-border">
            <MoreHorizontal className="h-4 w-4" />
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
