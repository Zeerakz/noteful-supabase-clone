
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
  getColumnWidth: (fieldId: string) => number;
  workspaceId: string;
  isSelected?: boolean;
  onSelect?: (pageId: string, selected: boolean) => void;
  isEvenRow?: boolean;
  hasSubItems?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (pageId: string) => void;
  resizingFields?: Set<string>;
}

export function DatabaseTableRow({
  page,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  getColumnWidth,
  workspaceId,
  isSelected = false,
  onSelect,
  isEvenRow = false,
  hasSubItems = false,
  isExpanded = false,
  onToggleExpand,
  resizingFields = new Set()
}: DatabaseTableRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const isAnyColumnResizing = resizingFields.size > 0;

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
        group transition-all duration-200 border-b border-border/5
        ${!isAnyColumnResizing ? 'hover:bg-muted/20' : ''}
        ${isSelected ? 'bg-accent/20' : ''}
        ${isAnyColumnResizing ? 'pointer-events-none' : ''}
      `}
    >
      {/* Selection Checkbox */}
      <TableCell 
        className="checkbox-cell p-0 border-r border-border/5"
        style={{ width: '48px' }}
      >
        <div className="table-cell-content justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelect}
            className={`
              transition-opacity duration-200
              ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              ${isAnyColumnResizing ? 'pointer-events-none' : ''}
            `}
          />
        </div>
      </TableCell>

      {/* Title Cell */}
      <TableCell 
        className="p-0 border-r border-border/5"
        style={{ width: `${getColumnWidth('title')}px` }}
      >
        <div className="table-cell-content">
          {hasSubItems && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpand}
              className={`h-6 w-6 p-0 mr-2 hover:bg-muted ${isAnyColumnResizing ? 'pointer-events-none' : ''}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          
          <div className="flex-1 overflow-hidden">
            <EditableCell
              value={page.title}
              onChange={(newTitle) => onTitleUpdate(page.id, newTitle)}
              placeholder="Untitled"
              disabled={isAnyColumnResizing}
              className="text-hero font-medium"
            />
          </div>
        </div>
      </TableCell>

      {/* Property Cells */}
      {fields.map((field, index) => {
        const cellValue = page.properties[field.id] || '';
        const isFieldResizing = resizingFields.has(field.id);
        const isLastField = index === fields.length - 1;
        
        return (
          <TableCell 
            key={field.id} 
            className={`p-0 ${!isLastField ? 'border-r border-border/5' : ''}`}
            style={{ width: `${getColumnWidth(field.id)}px` }}
          >
            <div className="table-cell-content">
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
                  className={`
                    w-full min-h-[24px] rounded-sm px-2 py-1 transition-colors duration-150 flex items-center overflow-hidden
                    ${!isAnyColumnResizing && !isFieldResizing ? 'cursor-text hover:bg-muted/20' : 'cursor-default'}
                    ${isAnyColumnResizing ? 'pointer-events-none' : ''}
                  `}
                  onClick={() => !isAnyColumnResizing && setEditingField(field.id)}
                >
                  {cellValue ? (
                    <div className="w-full overflow-hidden">
                      <span className="text-hero text-foreground/90">
                        {cellValue}
                      </span>
                    </div>
                  ) : (
                    <span className={`text-muted-foreground/50 text-sm ${isAnyColumnResizing ? 'text-muted-foreground/30' : ''}`}>
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
      <TableCell 
        className="actions-cell p-0"
        style={{ width: '64px' }}
      >
        <div className="table-cell-content justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`
                  h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-muted/50
                  ${isAnyColumnResizing ? 'pointer-events-none' : ''}
                `}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover shadow-lg">
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
