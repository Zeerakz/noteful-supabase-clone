
import React from 'react';
import { SimpleTableBody } from './SimpleTableBody';
import { DatabaseField } from '@/types/database';

interface PageWithProperties {
  id: string;
  title: string;
  properties: Record<string, string>;
}

interface VirtualizedTableBodyProps {
  pages: PageWithProperties[];
  fields: DatabaseField[];
  onTitleUpdate: (pageId: string, newTitle: string) => void;
  onPropertyUpdate: (pageId: string, fieldId: string, value: string) => void;
  onDeleteRow: (pageId: string) => void;
  isLoading?: boolean;
  parentRef: React.RefObject<HTMLDivElement>;
}

export function VirtualizedTableBody({
  pages,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  isLoading = false,
  parentRef
}: VirtualizedTableBodyProps) {
  // For now, we'll use the simple table body implementation
  // This can be enhanced with virtualization later if needed for very large datasets
  return (
    <SimpleTableBody
      pages={pages}
      fields={fields}
      onTitleUpdate={onTitleUpdate}
      onPropertyUpdate={onPropertyUpdate}
      onDeleteRow={onDeleteRow}
      isLoading={isLoading}
    />
  );
}
