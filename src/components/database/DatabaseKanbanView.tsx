
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Kanban, Settings } from 'lucide-react';
import { DragDropContext } from 'react-beautiful-dnd';
import { KanbanColumn } from './kanban/KanbanColumn';
import { useKanbanData } from './kanban/hooks/useKanbanData';
import { useKanbanDragDrop } from './kanban/hooks/useKanbanDragDrop';
import { DatabaseField } from '@/types/database';

interface DatabaseKanbanViewProps {
  databaseId: string;
  workspaceId: string;
  fields?: DatabaseField[];
}

export function DatabaseKanbanView({ databaseId, workspaceId, fields = [] }: DatabaseKanbanViewProps) {
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  
  // Find all select-type fields for grouping options
  const selectFields = fields.filter(field => 
    field.type === 'select' || field.type === 'multi_select'
  );

  // Set default select field
  useEffect(() => {
    if (selectFields.length > 0 && !selectedFieldId) {
      setSelectedFieldId(selectFields[0].id);
    }
  }, [selectFields, selectedFieldId]);

  const {
    fields: allFields,
    pages,
    columns,
    loading,
    error,
    selectField,
    setColumns,
    setPages
  } = useKanbanData({ 
    databaseId, 
    selectedFieldId: selectedFieldId || selectFields[0]?.id 
  });

  const { handleDragEnd } = useKanbanDragDrop({
    fields: allFields,
    pages,
    columns,
    selectField,
    setColumns,
    setPages
  });

  // Get the currently selected field for display
  const currentSelectField = selectFields.find(field => field.id === selectedFieldId) || selectFields[0];

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

  if (selectFields.length === 0) {
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
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-medium">Kanban View</h3>
            <p className="text-sm text-muted-foreground">
              Grouped by select field
            </p>
          </div>
          
          {selectFields.length > 1 && (
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Group by field" />
                </SelectTrigger>
                <SelectContent>
                  {selectFields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name} ({field.type === 'multi_select' ? 'Multi-select' : 'Select'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Card
        </Button>
      </div>

      {currentSelectField && (
        <div className="text-sm text-muted-foreground">
          Currently grouping by: <span className="font-medium">{currentSelectField.name}</span>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
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
