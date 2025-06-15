
import React from 'react';
import { ButtonAction, ButtonPropertyConfig } from '@/types/property/configs/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { ActionItem } from './ActionItem';

interface ActionListEditorProps {
  config: ButtonPropertyConfig;
  onConfigChange: (config: Partial<ButtonPropertyConfig>) => void;
  workspaceId?: string;
  currentDatabaseId?: string;
}

export function ActionListEditor({
  config,
  onConfigChange,
  workspaceId,
  currentDatabaseId,
}: ActionListEditorProps) {
  const [expandedAction, setExpandedAction] = React.useState<string | null>(null);

  const addAction = () => {
    const newAction: ButtonAction = {
      id: `action_${Date.now()}`,
      type: 'open_link',
      label: 'New Action',
      config: { url: '', openInNewTab: true }
    };
    onConfigChange({ actions: [...config.actions, newAction] });
    setExpandedAction(newAction.id);
  };

  const updateAction = (actionId: string, updates: Partial<ButtonAction> | { config: any }) => {
    const updatedActions = config.actions.map(action =>
      action.id === actionId ? { ...action, ...updates } : action
    );
    onConfigChange({ actions: updatedActions });
  };

  const removeAction = (actionId: string) => {
    const updatedActions = config.actions.filter(action => action.id !== actionId);
    onConfigChange({ actions: updatedActions });
    if (expandedAction === actionId) {
      setExpandedAction(null);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(config.actions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    onConfigChange({ actions: items });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Actions
          <Button onClick={addAction} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Action
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {config.actions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No actions configured</p>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="actions">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {config.actions.map((action, index) => (
                    <Draggable key={action.id} draggableId={action.id} index={index}>
                      {(provided) => (
                        <ActionItem
                          action={action}
                          isExpanded={expandedAction === action.id}
                          onUpdate={(updates) => updateAction(action.id, updates)}
                          onRemove={() => removeAction(action.id)}
                          onToggleExpand={() => setExpandedAction(
                            expandedAction === action.id ? null : action.id
                          )}
                          draggableProvided={provided}
                          workspaceId={workspaceId}
                          currentDatabaseId={currentDatabaseId}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </CardContent>
    </Card>
  );
}
