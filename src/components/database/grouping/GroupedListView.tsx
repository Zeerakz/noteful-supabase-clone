
import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DatabaseField } from '@/types/database';
import { FlattenedGroup } from '@/types/grouping';
import { getGroupKey } from '@/utils/multiLevelGrouping';
import { ListCard } from '../list/ListCard';

interface GroupedListViewProps {
  groups: FlattenedGroup[];
  fields: DatabaseField[];
  onToggleGroupCollapse: (groupKey: string) => void;
  onFieldEdit: (pageId: string, fieldId: string, value: string) => void;
  onTitleEdit: (pageId: string, title: string) => void;
}

export function GroupedListView({
  groups,
  fields,
  onToggleGroupCollapse,
  onFieldEdit,
  onTitleEdit
}: GroupedListViewProps) {
  const handleToggleGroup = (group: FlattenedGroup) => {
    const groupKey = getGroupKey(group.groupPath);
    onToggleGroupCollapse(groupKey);
  };

  const getIndentLevel = (level: number) => {
    return level * 16; // 16px per level
  };

  const renderGroupHeader = (group: FlattenedGroup) => {
    const field = fields.find(f => f.id === group.fieldId);
    const itemCount = group.items.length;
    
    return (
      <div 
        key={`group-${getGroupKey(group.groupPath)}`}
        className="mb-4"
        style={{ marginLeft: `${getIndentLevel(group.level)}px` }}
      >
        <Card className="border-l-4 border-l-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleGroup(group)}
                className="h-8 w-8 p-0"
              >
                {group.isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              
              <div className="flex items-center gap-2 flex-1">
                <h3 className="text-lg font-semibold">
                  {group.groupValue || 'Uncategorized'}
                </h3>
                
                <Badge variant="secondary" className="text-xs">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </Badge>
                
                {field && (
                  <Badge variant="outline" className="text-xs">
                    {field.name}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  };

  const renderGroupItems = (group: FlattenedGroup) => {
    if (group.isCollapsed) return null;
    
    return (
      <div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6"
        style={{ marginLeft: `${getIndentLevel(group.level + 1)}px` }}
      >
        {group.items.map((item) => (
          <ListCard
            key={item.id}
            page={{
              pageId: item.id,
              title: item.title,
              properties: item.properties
            }}
            fields={fields}
            onFieldEdit={onFieldEdit}
            onTitleEdit={onTitleEdit}
          />
        ))}
      </div>
    );
  };

  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No groups to display
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {groups.map((group) => (
        <React.Fragment key={getGroupKey(group.groupPath)}>
          {renderGroupHeader(group)}
          {renderGroupItems(group)}
        </React.Fragment>
      ))}
    </div>
  );
}
