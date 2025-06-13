
import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Trash2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  getColumnWidth: (fieldId: string) => number;
  workspaceId: string;
  isSelected?: boolean;
  onSelect?: (pageId: string, selected: boolean) => void;
  isEvenRow?: boolean;
  hasSubItems?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (pageId: string) => void;
  resizingFields?: Set<string>;
  userProfiles?: any[];
  allFields?: DatabaseField[];
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
  resizingFields = new Set(),
  userProfiles = [],
  allFields = []
}: DatabaseTableRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);

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
        group
        ${isSelected ? 'bg-accent/20' : ''}
        ${isAnyColumnResizing ? 'pointer-events-none opacity-75' : ''}
      `}
    >
      {/* Selection Checkbox */}
      <TableCell style={{ width: '48px' }}>
        <div className="flex items-center justify-center">
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
      <TableCell style={{ width: `${getColumnWidth('title')}px` }}>
        <div className="flex items-center gap-2">
          {hasSubItems && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpand}
              className={`
                h-6 w-6 p-0 transition-all duration-200
                hover:bg-muted/50
                ${isAnyColumnResizing ? 'pointer-events-none' : ''}
              `}
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
              className="text-sm font-medium"
            />
          </div>
        </div>
      </TableCell>

      {/* Property Cells */}
      {fields.map((field) => {
        const cellValue = page.properties[field.id] || '';
        const isFieldResizing = resizingFields.has(field.id);
        
        return (
          <TableCell 
            key={field.id} 
            style={{ width: `${getColumnWidth(field.id)}px` }}
          >
            <EditableCell
              value={cellValue}
              onChange={(value) => onPropertyUpdate(page.id, field.id, value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              disabled={isAnyColumnResizing || isFieldResizing}
              field={field}
              workspaceId={workspaceId}
              pageId={page.id}
              userProfiles={userProfiles}
              allFields={allFields}
              className="w-full"
            />
          </TableCell>
        );
      })}

      {/* Actions Cell */}
      <TableCell style={{ width: '64px' }}>
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`
                  h-8 w-8 p-0 transition-opacity duration-200
                  ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                  hover:bg-muted/50
                  ${isAnyColumnResizing ? 'pointer-events-none' : ''}
                `}
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
        </div>
      </TableCell>
    </TableRow>
  );
}
