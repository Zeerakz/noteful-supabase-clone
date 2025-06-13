
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
  const [isHovered, setIsHovered] = useState(false);

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
        group transition-all duration-300 ease-out border-b border-border/5
        ${!isAnyColumnResizing && isHovered ? 'brightness-[1.02] shadow-[0_1px_3px_rgba(0,0,0,0.02)]' : ''}
        ${isSelected ? 'bg-accent/10 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.1)]' : ''}
        ${isAnyColumnResizing ? 'pointer-events-none opacity-75' : ''}
        relative
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle drag handle that appears on hover */}
      {isHovered && !isAnyColumnResizing && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-muted-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity duration-300 ease-out">
            <GripVertical className="h-3 w-3 text-muted-foreground/40" />
          </div>
        </div>
      )}

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
              transition-all duration-300 ease-out
              ${isSelected ? 'opacity-100 shadow-[0_0_8px_hsl(var(--primary)/0.15)]' : 'opacity-0 group-hover:opacity-100'}
              ${isAnyColumnResizing ? 'pointer-events-none' : ''}
              focus-visible:ring-0 focus-visible:shadow-[0_0_12px_hsl(var(--primary)/0.25)]
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
              className={`
                h-6 w-6 p-0 mr-2 transition-all duration-300 ease-out
                hover:bg-muted/50 hover:shadow-[0_0_6px_hsl(var(--primary)/0.1)]
                focus-visible:ring-0 focus-visible:shadow-[0_0_10px_hsl(var(--primary)/0.2)]
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
              className="text-sm font-medium text-foreground focus-within:shadow-[0_0_8px_hsl(var(--primary)/0.15)] transition-shadow duration-300 ease-out"
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
                className="w-full min-h-[24px] rounded-sm px-2 py-1 transition-all duration-300 ease-out flex items-center overflow-hidden bg-background text-foreground hover:bg-background/80 focus-within:shadow-[0_0_8px_hsl(var(--primary)/0.15)] focus-within:bg-background/90"
              />
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
                  h-8 w-8 p-0 transition-all duration-300 ease-out
                  ${isSelected || isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                  hover:bg-muted/50 hover:shadow-[0_0_6px_hsl(var(--primary)/0.1)]
                  focus-visible:ring-0 focus-visible:shadow-[0_0_10px_hsl(var(--primary)/0.2)]
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
                className="text-destructive focus:text-destructive hover:bg-destructive/10 focus:shadow-[0_0_6px_hsl(var(--destructive)/0.15)] transition-shadow duration-200"
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
