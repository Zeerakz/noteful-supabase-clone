
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { DatabaseListItem } from './DatabaseListItem';
import { Database } from '@/types/database';

interface DraggableDatabaseItemProps {
  database: Database;
  index: number;
  onDelete: (databaseId: string, databaseName: string) => void;
}

export function DraggableDatabaseItem({ database, index, onDelete }: DraggableDatabaseItemProps) {
  return (
    <Draggable draggableId={`database-${database.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`${snapshot.isDragging ? 'opacity-75 shadow-lg' : ''}`}
        >
          <DatabaseListItem
            database={database}
            onDelete={onDelete}
          />
        </div>
      )}
    </Draggable>
  );
}
