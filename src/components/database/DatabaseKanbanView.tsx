
import React from 'react';
import { Kanban } from 'lucide-react';
import { DragDropContext } from 'react-beautiful-dnd';
import { KanbanColumn } from './kanban/KanbanColumn';
import { KanbanViewHeader } from './kanban/KanbanViewHeader';
import { useKanbanData } from './kanban/hooks/useKanbanData';
import { useKanbanFieldSelection } from './kanban/hooks/useKanbanFieldSelection';
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
    setColumns,
    setPages
  } = useKanbanData({ databaseId, selectedField: null });

  const {
    selectedField,
    selectFields,
    handleFieldChange
  } = useKanbanFieldSelection({ fields });

  // Re-fetch data when selected field changes
  const {
    fields: updatedFields,
    pages: updatedPages,
    columns: updatedColumns,
    loading: updatedLoading,
    error: updatedError,
    setColumns: setUpdatedColumns,
    setPages: setUpdatedPages
  } = useKanbanData({ databaseId, selectedField });

  const { handleDragEnd } = useKanbanDragDrop({
    fields: updatedFields,
    pages: updatedPages,
    columns: updatedColumns,
    selectField: selectedField,
    databaseId,
    setColumns: setUpdatedColumns,
    setPages: setUpdatedPages
  });

  if (updatedLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Kanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading kanban...</p>
        </div>
      </div>
    );
  }

  if (updatedError) {
    return (
      <div className="text-center h-full flex items-center justify-center">
        <p className="text-destructive">{updatedError}</p>
      </div>
    );
  }

  if (selectFields.length === 0) {
    return (
      <div className="text-center h-full flex items-center justify-center">
        <div>
          <Kanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Select Field Available</h3>
          <p className="text-muted-foreground mb-4">
            Kanban view requires at least one select-type field in your database to group by.
          </p>
          <p className="text-sm text-muted-foreground">
            Add a select field to your database to use the kanban view.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <KanbanViewHeader
        selectFields={selectFields}
        selectedField={selectedField}
        onFieldChange={handleFieldChange}
      />

      <div className="flex-1 min-h-0">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 overflow-x-auto h-full pb-4">
            {updatedColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                fields={updatedFields}
              />
            ))}
          </div>
        </DragDropContext>

        {updatedPages.length === 0 && (
          <div className="text-center h-full flex items-center justify-center">
            <div>
              <Kanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No cards yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first database entry to see it on the kanban board.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
