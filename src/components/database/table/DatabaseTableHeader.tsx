
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
}

export function DatabaseTableHeader({ 
  fields, 
  sortRules, 
  onSort, 
  onFieldsChange,
  onFieldReorder 
}: DatabaseTableHeaderProps) {
  return (
    <TableHeader className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b-2 border-border">
      <TableRow className="hover:bg-transparent border-none">
        {/* Selection Column */}
        <TableHead className="w-12 p-3 bg-card/95 border-r border-border/40">
          <div className="flex items-center justify-center">
            <Checkbox className="opacity-50" />
          </div>
        </TableHead>

        {/* Title Column */}
        <TableHead className="w-[280px] p-0 bg-card/95 border-r border-border/40">
          <div className="px-4 py-3 font-semibold text-foreground">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">📝</span>
              Title
            </div>
          </div>
        </TableHead>

        {/* Field Columns */}
        {fields.map((field) => (
          <TableHead key={field.id} className="min-w-[200px] p-0 bg-card/95 border-r border-border/40 last:border-r-0">
            <DatabaseColumnHeader
              field={field}
              sortRules={sortRules}
              onSort={onSort}
              onFieldsChange={onFieldsChange}
              onFieldReorder={onFieldReorder}
              isDraggable={true}
            />
          </TableHead>
        ))}

        {/* Actions Column */}
        <TableHead className="w-16 p-3 bg-card/95">
          <div className="text-center text-xs font-medium text-muted-foreground">
            •••
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
