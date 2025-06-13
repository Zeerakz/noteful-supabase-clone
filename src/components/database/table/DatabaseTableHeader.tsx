
import React, { useState } from 'react';
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
  onResizeStateChange?: (resizingFields: Set<string>) => void;
}

export function DatabaseTableHeader({ 
  fields, 
  sortRules, 
  onSort, 
  onFieldsChange,
  onFieldReorder,
  getColumnWidth,
  onColumnResize,
  onResizeStateChange
}: DatabaseTableHeaderProps) {
  const [resizingFields, setResizingFields] = useState<Set<string>>(new Set());

  const handleResizeStateChange = (fieldId: string, isResizing: boolean) => {
    setResizingFields(prev => {
      const newSet = new Set(prev);
      if (isResizing) {
        newSet.add(fieldId);
      } else {
        newSet.delete(fieldId);
      }
      
      if (onResizeStateChange) {
        onResizeStateChange(newSet);
      }
      
      return newSet;
    });
  };

  return (
    <TableHeader className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b-2 border-border">
      <TableRow className="hover:bg-transparent border-none">
        {/* Selection Column - Fixed width */}
        <TableHead 
          className="w-12 p-3 bg-card/95 border-r border-border/40"
          style={{ width: '48px' }}
        >
          <div className="flex items-center justify-center">
            <Checkbox className="opacity-50" />
          </div>
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
            onResizeStateChange={handleResizeStateChange}
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
              onResizeStateChange={handleResizeStateChange}
              width={getColumnWidth(field.id)}
              isDraggable={true}
              className="border-b-0"
            />
          </TableHead>
        ))}

        {/* Actions Column - Fixed width */}
        <TableHead 
          className="w-16 p-3 bg-card/95"
          style={{ width: '64px' }}
        >
          <div className="text-center text-xs font-medium text-muted-foreground">
            •••
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
