
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
  columnWidths?: Record<string, number>;
  onColumnResize?: (fieldId: string, width: number) => void;
}

export function DatabaseTableHeader({ 
  fields, 
  sortRules, 
  onSort, 
  onFieldsChange,
  onFieldReorder,
  columnWidths = {},
  onColumnResize
}: DatabaseTableHeaderProps) {
  return (
    <TableHeader className="sticky top-0 z-20 bg-background border-b">
      <TableRow className="hover:bg-transparent border-b border-border">
        {/* Selection Column */}
        <TableHead className="w-[50px] p-0 bg-background border-r border-border/50">
          <div className="flex items-center justify-center h-12 px-3">
            <Checkbox className="opacity-50" />
          </div>
        </TableHead>

        {/* Title Column */}
        <TableHead 
          className="min-w-[250px] p-0 bg-background border-r border-border/50"
          style={{ width: columnWidths['title'] ? `${columnWidths['title']}px` : '250px' }}
        >
          <div className="flex items-center gap-2.5 px-4 py-3 h-12">
            <div className="flex-shrink-0 p-1 rounded-md bg-muted/40">
              <span className="text-xs font-medium text-muted-foreground">T</span>
            </div>
            <button
              onClick={() => onSort('title', sortRules.find(r => r.fieldId === 'title')?.direction === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2 px-1 py-1 h-auto font-semibold text-sm text-foreground hover:bg-transparent hover:text-primary flex-1 justify-start min-w-0 transition-colors"
            >
              <span className="truncate tracking-tight">Title</span>
            </button>
          </div>
        </TableHead>

        {/* Field Columns */}
        {fields.map((field, index) => (
          <TableHead 
            key={field.id} 
            className={`min-w-[180px] p-0 bg-background ${index < fields.length - 1 ? 'border-r border-border/50' : ''}`}
            style={{ width: columnWidths[field.id] ? `${columnWidths[field.id]}px` : '180px' }}
          >
            <DatabaseColumnHeader
              field={field}
              sortRules={sortRules}
              onSort={onSort}
              onFieldsChange={onFieldsChange}
              onFieldReorder={onFieldReorder}
              onResize={onColumnResize}
              width={columnWidths[field.id] || 180}
              isDraggable={true}
              className="h-12"
            />
          </TableHead>
        ))}

        {/* Actions Column */}
        <TableHead className="w-[60px] p-0 bg-background">
          <div className="flex items-center justify-center h-12 px-3">
            <div className="text-xs font-medium text-muted-foreground">
              •••
            </div>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
