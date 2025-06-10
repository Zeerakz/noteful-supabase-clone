
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { DatabaseField } from '@/types/database';
import { KanbanColumn as KanbanColumnType } from './types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  column: KanbanColumnType;
  fields: DatabaseField[];
}

export function KanbanColumn({ column, fields }: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-80 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          {column.title}
        </h4>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {column.pages.length}
        </span>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
              snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-muted/20'
            }`}
          >
            {column.pages.map((page, index) => (
              <Draggable
                key={page.pageId}
                draggableId={page.pageId}
                index={index}
              >
                {(provided, snapshot) => (
                  <KanbanCard
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    page={page}
                    fields={fields}
                    isDragging={snapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <Button
        variant="ghost"
        size="sm"
        className="mt-3 gap-2 justify-start text-muted-foreground"
      >
        <Plus className="h-4 w-4" />
        Add card
      </Button>
    </div>
  );
}
