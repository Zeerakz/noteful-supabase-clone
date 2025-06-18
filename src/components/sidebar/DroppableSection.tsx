
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';

interface DroppableSectionProps {
  droppableId: string;
  children: React.ReactNode;
  className?: string;
  placeholder?: string;
}

export function DroppableSection({ droppableId, children, className = '', placeholder }: DroppableSectionProps) {
  return (
    <Droppable droppableId={droppableId} type="MIXED">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`${className} ${snapshot.isDraggingOver ? 'bg-accent/20 rounded-md' : ''} transition-colors`}
        >
          {children}
          {provided.placeholder}
          {snapshot.isDraggingOver && placeholder && (
            <div className="p-2 text-xs text-muted-foreground text-center border-2 border-dashed border-accent rounded-md mx-2 my-1">
              {placeholder}
            </div>
          )}
        </div>
      )}
    </Droppable>
  );
}
