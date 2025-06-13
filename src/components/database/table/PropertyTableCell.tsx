
import React, { useState } from 'react';
import { TableCell } from '@/components/ui/table';
import { DatabaseField } from '@/types/database';
import { OptimizedPropertyTableCell } from './OptimizedPropertyTableCell';

interface PropertyTableCellProps {
  field: DatabaseField;
  value: string;
  pageId: string;
  workspaceId: string;
  width: number;
  onValueChange: (value: string) => void;
  isResizing?: boolean;
  allFields?: DatabaseField[];
  rowIndex?: number;
}

export function PropertyTableCell({
  field,
  value,
  pageId,
  workspaceId,
  width,
  onValueChange,
  isResizing = false,
  allFields = [],
  rowIndex = 0
}: PropertyTableCellProps) {
  // Use the optimized version which handles lazy loading for rollups
  return (
    <OptimizedPropertyTableCell
      field={field}
      value={value}
      pageId={pageId}
      workspaceId={workspaceId}
      width={width}
      onValueChange={onValueChange}
      isResizing={isResizing}
      allFields={allFields}
      rowIndex={rowIndex}
    />
  );
}
