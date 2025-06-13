
import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatabaseField } from '@/types/database';
import { FlattenedGroup } from '@/types/grouping';
import { getGroupKey } from '@/utils/multiLevelGrouping';
import { PropertyTableCell } from '../table/PropertyTableCell';

interface GroupedTableViewProps {
  groups: FlattenedGroup[];
  fields: DatabaseField[];
  onToggleGroupCollapse: (groupKey: string) => void;
  onTitleUpdate: (pageId: string, newTitle: string) => void;
  onPropertyUpdate: (pageId: string, fieldId: string, value: string) => void;
  workspaceId: string;
  getColumnWidth: (fieldId: string) => number;
}

export function GroupedTableView({
  groups,
  fields,
  onToggleGroupCollapse,
  onTitleUpdate,
  onPropertyUpdate,
  workspaceId,
  getColumnWidth
}: GroupedTableViewProps) {
  const handleToggleGroup = (group: FlattenedGroup) => {
    const groupKey = getGroupKey(group.groupPath);
    onToggleGroupCollapse(groupKey);
  };

  const getIndentLevel = (level: number) => {
    return level * 24; // 24px per level
  };

  const renderGroupHeader = (group: FlattenedGroup) => {
    const field = fields.find(f => f.id === group.fieldId);
    const itemCount = group.items.length;
    
    return (
      <TableRow 
        key={`group-${getGroupKey(group.groupPath)}`}
        className="bg-muted/30 hover:bg-muted/50 border-l-4 border-l-primary/20"
      >
        <TableCell 
          colSpan={fields.length + 2}
          className="font-medium"
          style={{ paddingLeft: `${16 + getIndentLevel(group.level)}px` }}
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleGroup(group)}
              className="h-6 w-6 p-0"
            >
              {group.isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            <span className="text-sm font-medium">
              {group.groupValue || 'Uncategorized'}
            </span>
            
            <Badge variant="secondary" className="text-xs">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Badge>
            
            {field && (
              <Badge variant="outline" className="text-xs">
                {field.name}
              </Badge>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderGroupItems = (group: FlattenedGroup) => {
    if (group.isCollapsed) return null;
    
    return group.items.map((item) => (
      <TableRow key={item.id} className="hover:bg-muted/50">
        <TableCell 
          style={{ 
            width: `${getColumnWidth('title')}px`,
            paddingLeft: `${16 + getIndentLevel(group.level + 1)}px`
          }}
          className="font-medium"
        >
          <input
            type="text"
            value={item.title}
            onChange={(e) => onTitleUpdate(item.id, e.target.value)}
            className="w-full bg-transparent border-none outline-none resize-none"
            placeholder="Untitled"
          />
        </TableCell>
        
        {fields.map((field) => (
          <TableCell 
            key={field.id}
            style={{ width: `${getColumnWidth(field.id)}px` }}
          >
            <PropertyTableCell
              field={field}
              value={item.properties[field.id] || ''}
              onValueChange={(value) => onPropertyUpdate(item.id, field.id, value)}
              workspaceId={workspaceId}
            />
          </TableCell>
        ))}
        
        <TableCell style={{ width: `${getColumnWidth('actions')}px` }}>
          {/* Action buttons if needed */}
        </TableCell>
      </TableRow>
    ));
  };

  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No groups to display
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: `${getColumnWidth('title')}px` }}>
              Title
            </TableHead>
            {fields.map((field) => (
              <TableHead 
                key={field.id}
                style={{ width: `${getColumnWidth(field.id)}px` }}
              >
                {field.name}
              </TableHead>
            ))}
            <TableHead style={{ width: `${getColumnWidth('actions')}px` }}>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <React.Fragment key={getGroupKey(group.groupPath)}>
              {renderGroupHeader(group)}
              {renderGroupItems(group)}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
