
import React from 'react';
import { TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { EditableCell } from './EditableCell';
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
}

export function DatabaseTableRow({
  page,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow
}: DatabaseTableRowProps) {
  return (
    <>
      <TableCell className="font-medium">
        <EditableCell
          value={page.title}
          onSave={(value) => onTitleUpdate(page.id, value)}
          placeholder="Enter title..."
        />
      </TableCell>
      {fields.map((field) => (
        <TableCell key={field.id}>
          <EditableCell
            value={page.properties[field.id] || ''}
            onSave={(value) => onPropertyUpdate(page.id, field.id, value)}
            fieldType={field.type}
            placeholder={`Enter ${field.name.toLowerCase()}...`}
          />
        </TableCell>
      ))}
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteRow(page.id)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </>
  );
}
