
import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditableCell } from './EditableCell';
import { FieldEditor } from '../fields/FieldEditor';
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
  workspaceId: string;
  isSelected?: boolean;
  onSelect?: (pageId: string, selected: boolean) => void;
  isEvenRow?: boolean;
  hasSubItems?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (pageId: string) => void;
}

export function DatabaseTableRow({
  page,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  columnWidths = {},
  workspaceId,
  isSelected = false,
  onSelect,
  isEvenRow = false,
  hasSubItems = false,
  isExpanded = false,
  onToggleExpand
}: DatabaseTableRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDeleteRow(page.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePropertyChange = (fieldId: string, value: string) => {
    onPropertyUpdate(page.id, fieldId, value);
    setEditingField(null);
  };

  const handleSelect = (checked: boolean) => {
    if (onSelect) {
      onSelect(page.id, checked);
    }
  };

  const handleToggleExpand = () => {
    if (onToggleExpand && hasSubItems) {
      onToggleExpand(page.id);
    }
  };

  return (
    <TableRow 
      className={`
        group transition-colors duration-150 border-b border-border/40
        hover:bg-muted/50 
        ${isSelected ? 'bg-primary/5 border-primary/20' : ''}
        ${isEvenRow ? 'bg-muted/20' : 'bg-background'}
        ${isSelected && isEvenRow ? 'bg-primary/8' : ''}
      `}
    >
      {/* Selection Checkbox */}
      <TableCell className="w-[48px] p-2">
        <div className="flex items-center justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelect}
            className={`
              transition-opacity duration-200
              ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
            `}
          />
        </div>
      </TableCell>

      {/* Title Cell with Expand/Collapse */}
      <TableCell 
        className="sticky left-[48px] bg-inherit border-r w-[200px] z-10"
        style={{ width: columnWidths['title'] ? `${columnWidths['title']}px` : '200px' }}
      >
        <div className="flex items-center gap-2">
          {/* Expand/Collapse Button */}
          {hasSubItems && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpand}
              className="h-6 w-6 p-0 hover:bg-muted/80"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          
          <div className="flex-1">
            <EditableCell
              value={page.title}
              onSave={(newTitle) => onTitleUpdate(page.id, newTitle)}
              placeholder="Untitled"
            />
          </div>
        </div>
      </TableCell>

      {/* Property Cells */}
      {fields.map((field) => (
        <TableCell 
          key={field.id} 
          className="min-w-[150px] p-1"
          style={{ width: columnWidths[field.id] ? `${columnWidths[field.id]}px` : undefined }}
        >
          {editingField === field.id ? (
            <div className="w-full">
              <FieldEditor
                field={field}
                value={page.properties[field.id] || ''}
                onChange={(value) => handlePropertyChange(field.id, value)}
                workspaceId={workspaceId}
                pageId={page.id}
              />
            </div>
          ) : (
            <div
              className="min-h-[32px] px-2 py-1 cursor-text hover:bg-muted/50 rounded flex items-center transition-colors duration-150"
              onClick={() => setEditingField(field.id)}
            >
              <FieldDisplay
                field={field}
                value={page.properties[field.id] || null}
                pageId={page.id}
              />
            </div>
          )}
        </TableCell>
      ))}

      {/* Actions Cell */}
      <TableCell className="w-[60px] p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
