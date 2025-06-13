
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
  getColumnWidth: (fieldId: string) => number;
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
  getColumnWidth,
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
        bg-background/95 backdrop-blur-md hairline-divider
      `}
    >
      <TableRow className="hover:bg-transparent">
        {/* Selection Column - Fixed width with consistent padding */}
        <TableHead 
          className="w-12 p-3 sticky left-0 z-40 bg-background/95 backdrop-blur-md hairline-vertical"
          style={{ width: '48px' }}
        >
          <div className="flex items-center justify-center">
            <Checkbox
              checked={isPartiallySelected ? 'indeterminate' : isAllSelected}
              onCheckedChange={handleSelectAll}
              className="transition-opacity duration-200"
            />
          </div>
        </TableHead>

        {/* Title Column - Use exact width from getColumnWidth */}
        <TableHead 
          className="sticky left-[48px] z-40 bg-background/95 backdrop-blur-md hairline-vertical p-0"
          style={{ width: `${getColumnWidth('title')}px`, minWidth: `${getColumnWidth('title')}px`, maxWidth: `${getColumnWidth('title')}px` }}
        >
          <div className="px-3 py-3">
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
              className="bg-background/95"
            />
          </div>
        </TableHead>

        {/* Dynamic Field Columns - Use exact width from getColumnWidth */}
        {fields.map((field, index) => {
          const isLastField = index === fields.length - 1;
          return (
            <TableHead 
              key={field.id} 
              className={`relative p-0 bg-background/95 backdrop-blur-md ${!isLastField ? 'hairline-vertical' : ''}`}
              style={{ 
                width: `${getColumnWidth(field.id)}px`, 
                minWidth: `${getColumnWidth(field.id)}px`, 
                maxWidth: `${getColumnWidth(field.id)}px` 
              }}
            >
              <div className="px-3 py-3">
                <DatabaseColumnHeader
                  field={field}
                  sortRules={sortRules}
                  onSort={onSort}
                  onResize={onColumnResize}
                  width={getColumnWidth(field.id)}
                  className="bg-background/95"
                />
              </div>
            </TableHead>
          );
        })}

        {/* Actions Column - Fixed width */}
        <TableHead 
          className="w-16 p-0 bg-background/95 backdrop-blur-md"
          style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}
        >
          <div className="flex items-center justify-center px-3 py-3 text-xs font-semibold text-muted-foreground bg-background/95 backdrop-blur-md">
            <MoreHorizontal className="h-4 w-4" />
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
