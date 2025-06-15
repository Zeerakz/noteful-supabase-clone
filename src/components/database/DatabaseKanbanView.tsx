
import React, { useState } from 'react';
import { Kanban, Plus, RefreshCw } from 'lucide-react';
import { DragDropContext } from 'react-beautiful-dnd';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from './SortingModal';
import { KanbanColumn } from './kanban/KanbanColumn';
import { KanbanViewHeader } from './kanban/KanbanViewHeader';
import { useKanbanData } from './kanban/hooks/useKanbanData';
import { useKanbanFieldSelection } from './kanban/hooks/useKanbanFieldSelection';
import { useKanbanDragDrop } from './kanban/hooks/useKanbanDragDrop';
import { Button } from '@/components/ui/button';
import { statusPropertyType } from '@/components/property/types/StatusPropertyType';
import { DatabaseViewError } from './DatabaseViewError';

interface DatabaseKanbanViewProps {
  databaseId: string;
  workspaceId: string;
  fields?: DatabaseField[];
  filterGroup?: FilterGroup;
  sortRules?: SortRule[];
  onFieldCreate?: (field: { name: string; type: string; settings?: any; }) => Promise<void>;
}

export function DatabaseKanbanView({ 
  databaseId, 
  workspaceId, 
  fields = [],
  filterGroup,
  sortRules = [],
  onFieldCreate,
}: DatabaseKanbanViewProps) {
  const [isCreatingField, setIsCreatingField] = useState(false);

  const {
    selectedField,
    selectFields,
    handleFieldChange
  } = useKanbanFieldSelection({ fields });

  const {
    fields: allFields,
    pages,
    columns,
    loading,
    error,
    setColumns,
    setPages
  } = useKanbanData({ 
    databaseId, 
    selectedField,
    filterGroup,
    sortRules 
  });

  const { handleDragEnd } = useKanbanDragDrop({
    fields: allFields,
    pages,
    selectField: selectedField,
    databaseId,
    setPages
  });

  const handleAddStatusField = async () => {
    if (!onFieldCreate) return;
    setIsCreatingField(true);
    try {
      await onFieldCreate({
        name: 'Status',
        type: 'status',
        settings: statusPropertyType.getDefaultConfig(),
      });
    } finally {
      setIsCreatingField(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Kanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading kanban...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <DatabaseViewError 
        error={error} 
        message="Could not load Kanban board data." 
      />
    );
  }

  if (selectFields.length === 0) {
    return (
      <div className="text-center h-full flex items-center justify-center">
        <div>
          <Kanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Grouping Field Available</h3>
          <p className="text-muted-foreground mb-4">
            Kanban view requires at least one select or status field in your database to group by.
          </p>
          {onFieldCreate && (
            <Button onClick={handleAddStatusField} disabled={isCreatingField}>
              {isCreatingField ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {isCreatingField ? 'Adding...' : 'Add a Status Property'}
            </Button>
          )}
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
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                fields={allFields}
              />
            ))}
          </div>
        </DragDropContext>

        {pages.length === 0 && (
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
