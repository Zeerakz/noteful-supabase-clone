
import React from 'react';
import { ButtonAction } from '@/types/property/configs/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Trash2, GripVertical } from 'lucide-react';
import { DraggableProvided } from 'react-beautiful-dnd';
import { CreatePageActionEditor } from './CreatePageActionEditor';
import { UpdatePagesActionEditor } from './UpdatePagesActionEditor';
import { OpenLinkActionEditor } from './OpenLinkActionEditor';

interface ActionItemProps {
  action: ButtonAction;
  isExpanded: boolean;
  onUpdate: (updates: Partial<ButtonAction> | { config: any }) => void;
  onRemove: () => void;
  onToggleExpand: () => void;
  draggableProvided: DraggableProvided;
  workspaceId?: string;
  currentDatabaseId?: string;
}

export function ActionItem({
  action,
  isExpanded,
  onUpdate,
  onRemove,
  onToggleExpand,
  draggableProvided,
  workspaceId,
  currentDatabaseId,
}: ActionItemProps) {

  const renderActionConfig = () => {
    const props = { action, onActionChange: onUpdate, workspaceId };
    switch (action.type) {
      case 'create_page_with_template':
        return <CreatePageActionEditor {...props} />;
      case 'update_pages':
        return <UpdatePagesActionEditor {...props} currentDatabaseId={currentDatabaseId} />;
      case 'open_link':
        return <OpenLinkActionEditor {...props} />;
      default:
        return null;
    }
  };

  return (
    <div ref={draggableProvided.innerRef} {...draggableProvided.draggableProps}>
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-grow">
              <div {...draggableProvided.dragHandleProps} className="cursor-grab p-1">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                value={action.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                className="font-medium"
                placeholder="Action label"
              />
              <Select
                value={action.type}
                onValueChange={(value: any) => onUpdate({ 
                  type: value,
                  config: value === 'open_link' 
                    ? { url: '', openInNewTab: true }
                    : value === 'update_pages'
                    ? { target: 'current_page', propertiesToUpdate: [] }
                    : { templateId: '' }
                })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create_page_with_template">Create Page</SelectItem>
                  <SelectItem value="update_pages">Update Pages</SelectItem>
                  <SelectItem value="open_link">Open Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-1">
              <Button onClick={onToggleExpand} size="sm" variant="ghost">
                <Settings className="h-4 w-4" />
              </Button>
              <Button onClick={onRemove} size="sm" variant="ghost">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0 pl-12">
            {renderActionConfig()}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
