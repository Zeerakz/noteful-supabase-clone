
import React, { useRef } from 'react';
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VirtualizedTableBody } from './VirtualizedTableBody';
import { DatabaseField } from '@/types/database';

interface PageWithProperties {
  id: string;
  title: string;
  properties: Record<string, string>;
}

interface VirtualizedTableProps {
  pages: PageWithProperties[];
  fields: DatabaseField[];
  onTitleUpdate: (pageId: string, newTitle: string) => void;
  onPropertyUpdate: (pageId: string, fieldId: string, value: string) => void;
  onDeleteRow: (pageId: string) => void;
  isLoading?: boolean;
  maxHeight?: string;
}

export function VirtualizedTable({
  pages,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  isLoading = false,
  maxHeight = "600px"
}: VirtualizedTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Fixed header */}
      <div className="border-b bg-muted/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] sticky left-0 bg-muted/50">
                Title
              </TableHead>
              {fields.map((field) => (
                <TableHead key={field.id} className="min-w-[150px]">
                  {field.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({field.type})
                  </span>
                </TableHead>
              ))}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>
      
      {/* Scrollable body with virtualization */}
      <div 
        ref={parentRef}
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <VirtualizedTableBody
          pages={pages}
          fields={fields}
          onTitleUpdate={onTitleUpdate}
          onPropertyUpdate={onPropertyUpdate}
          onDeleteRow={onDeleteRow}
          isLoading={isLoading}
          parentRef={parentRef}
        />
      </div>
    </div>
  );
}
