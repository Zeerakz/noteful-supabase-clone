
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Kanban } from 'lucide-react';
import { DragDropContext } from 'react-beautiful-dnd';
import { KanbanColumn } from './kanban/KanbanColumn';
import { useKanbanData } from './kanban/hooks/useKanbanData';
import { useKanbanDragDrop } from './kanban/hooks/useKanbanDragDrop';

interface DatabaseKanbanViewProps {
  databaseId: string;
  workspaceId: string;
}

export function DatabaseKanbanView({ databaseId, workspaceId }: DatabaseKanbanViewProps) {
  const {
    fields,
    pages,
    columns,
    loading,
    error,
    selectField,
    setColumns,
    setPages
  } = useKanbanData({ databaseId });

  const { handleDragEnd } = useKanbanDragDrop({
    fields,
    pages,
    columns,
    selectField,
    setColumns,
    setPages
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Kanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading kanban...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!selectField) {
    return (
      <div className="text-center py-12">
        <Kanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Select Field Available</h3>
        <p className="text-muted-foreground mb-4">
          Kanban view requires at least one select-type field in your database to group by.
        </p>
        <p className="text-sm text-muted-foreground">
          Add a select field to your database to use the kanban view.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Kanban View</h3>
          <p className="text-sm text-muted-foreground">
            Grouped by {selectField.name}
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Card
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              fields={fields}
            />
          ))}
        </div>
      </DragDropContext>

      {pages.length === 0 && (
        <div className="text-center py-8">
          <Kanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No cards yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first database entry to see it on the kanban board.
          </p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create First Card
          </Button>
        </div>
      )}
    </div>
  );
}
