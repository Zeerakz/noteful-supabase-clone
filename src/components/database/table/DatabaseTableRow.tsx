
import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditableCell } from './EditableCell';
import { FieldDisplay } from '../fields/FieldDisplay';
import { DatabaseField } from '@/types/database';

interface PageWithProperties {
  id: string;
  title: string;
  properties: Record<string, string>;
}

interface DatabaseTableRowProps {
  page: PageWithProperties;
  fields: DatabaseField[];
  onTitleUpdate: (pageId: string, newTitle: string) => void;
  onPropertyUpdate: (pageId: string, fieldId: string, value: string) => void;
  onDeleteRow: (pageId: string) => void;
  columnWidths?: Record<string, number>;
}

export function DatabaseTableRow({
  page,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  columnWidths = {}
}: DatabaseTableRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDeleteRow(page.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <TableRow className="group">
      {/* Title Cell */}
      <TableCell 
        className="sticky left-0 bg-background border-r w-[200px]"
        style={{ width: columnWidths['title'] ? `${columnWidths['title']}px` : '200px' }}
      >
        <EditableCell
          value={page.title}
          onSave={(newTitle) => onTitleUpdate(page.id, newTitle)}
          placeholder="Untitled"
        />
      </TableCell>

      {/* Property Cells */}
      {fields.map((field) => (
        <TableCell 
          key={field.id} 
          className="min-w-[150px]"
          style={{ width: columnWidths[field.id] ? `${columnWidths[field.id]}px` : undefined }}
        >
          <FieldDisplay
            field={field}
            value={page.properties[field.id] || ''}
            onValueChange={(value) => onPropertyUpdate(page.id, field.id, value)}
          />
        </TableCell>
      ))}

      {/* Actions Cell */}
      <TableCell className="w-[50px]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
