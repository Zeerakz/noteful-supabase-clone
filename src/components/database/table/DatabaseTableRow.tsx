
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
        group transition-all duration-200 border-b border-border/30
        hover:bg-muted/40 hover:shadow-sm
        ${isSelected ? 'bg-accent/30 border-accent/50' : ''}
        ${isEvenRow ? 'bg-muted/10' : 'bg-background'}
      `}
    >
      {/* Selection Checkbox */}
      <TableCell className="w-12 p-3 border-r border-border/20">
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

      {/* Title Cell */}
      <TableCell 
        className="p-0 border-r border-border/20"
        style={{ width: columnWidths['title'] ? `${columnWidths['title']}px` : '280px' }}
      >
        <div className="flex items-center gap-2 px-4 py-3">
          {hasSubItems && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpand}
              className="h-6 w-6 p-0 hover:bg-muted"
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
      {fields.map((field) => {
        const cellValue = page.properties[field.id] || '';
        
        return (
          <TableCell 
            key={field.id} 
            className="p-0 border-r border-border/20 last:border-r-0"
            style={{ width: columnWidths[field.id] ? `${columnWidths[field.id]}px` : '200px' }}
          >
            <div className="px-4 py-3">
              {editingField === field.id ? (
                <FieldEditor
                  field={field}
                  value={cellValue}
                  onChange={(value) => handlePropertyChange(field.id, value)}
                  workspaceId={workspaceId}
                  pageId={page.id}
                />
              ) : (
                <div
                  className="min-h-[24px] cursor-text hover:bg-muted/30 rounded px-2 py-1 transition-colors duration-150 flex items-center"
                  onClick={() => setEditingField(field.id)}
                >
                  {cellValue ? (
                    <EditableCell
                      value={cellValue}
                      onSave={(value) => handlePropertyChange(field.id, value)}
                      fieldType={field.type}
                      fieldConfig={field.settings}
                      placeholder={`Enter ${field.name.toLowerCase()}`}
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Enter {field.name.toLowerCase()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </TableCell>
        );
      })}

      {/* Actions Cell */}
      <TableCell className="w-16 p-3">
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border border-border shadow-lg">
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
