
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DatabaseField } from '@/types/database';
import { OptimizedPropertyTableCell } from './OptimizedPropertyTableCell';

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
  getColumnWidth: (fieldId: string) => number;
  workspaceId: string;
}

export function VirtualizedTableBody({
  pages,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  isLoading = false,
  getColumnWidth,
  workspaceId
}: VirtualizedTableBodyProps) {
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleValue, setTitleValue] = useState<string>('');

  const handleTitleClick = (pageId: string, title: string) => {
    setEditingTitle(pageId);
    setTitleValue(title || '');
  };

  const handleTitleSave = (pageId: string) => {
    onTitleUpdate(pageId, titleValue);
    setEditingTitle(null);
    setTitleValue('');
  };

  const handleTitleCancel = () => {
    setEditingTitle(null);
    setTitleValue('');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent, pageId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave(pageId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleTitleCancel();
    }
  };

  const totalWidth = getColumnWidth('checkbox') + getColumnWidth('title') + 
    fields.reduce((sum, field) => sum + getColumnWidth(field.id), 0) + 
    getColumnWidth('actions');

  return (
    <Table className="table-fixed" style={{ width: `${totalWidth}px` }}>
      <TableBody>
        {pages.map((page, rowIndex) => (
          <TableRow key={page.id} className="border-b hover:bg-muted/50">
            {/* Checkbox column */}
            <TableCell 
              className="p-2 text-center border-r border-border/20" 
              style={{ width: `${getColumnWidth('checkbox')}px` }}
            >
              <Checkbox />
            </TableCell>

            {/* Title column */}
            <TableCell 
              className="p-2 border-r border-border/20" 
              style={{ width: `${getColumnWidth('title')}px` }}
            >
              {editingTitle === page.id ? (
                <Input
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={() => handleTitleSave(page.id)}
                  onKeyDown={(e) => handleTitleKeyDown(e, page.id)}
                  className="w-full"
                  autoFocus
                />
              ) : (
                <div
                  className="cursor-text hover:bg-muted/50 p-1 rounded min-h-[24px] font-medium"
                  onClick={() => handleTitleClick(page.id, page.title)}
                >
                  {page.title || (
                    <span className="text-muted-foreground italic font-normal">Untitled</span>
                  )}
                </div>
              )}
            </TableCell>

            {/* Property columns with optimized cells */}
            {fields.map((field) => (
              <OptimizedPropertyTableCell
                key={field.id}
                field={field}
                value={page.properties[field.id] || ''}
                pageId={page.id}
                workspaceId={workspaceId}
                width={getColumnWidth(field.id)}
                onValueChange={(value) => onPropertyUpdate(page.id, field.id, value)}
                allFields={fields}
                rowIndex={rowIndex}
              />
            ))}

            {/* Actions column */}
            <TableCell 
              className="p-2 text-center" 
              style={{ width: `${getColumnWidth('actions')}px` }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onDeleteRow(page.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
