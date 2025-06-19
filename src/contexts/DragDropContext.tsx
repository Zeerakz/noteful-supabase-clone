
import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragMoveEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface DragDropContextType {
  activeId: string | null;
  overId: string | null;
  dropIndicator: {
    show: boolean;
    position: { x: number; y: number };
    type: 'above' | 'below' | 'inside';
  };
  setDropIndicator: (indicator: any) => void;
}

const DragDropContextValue = createContext<DragDropContextType>({
  activeId: null,
  overId: null,
  dropIndicator: { show: false, position: { x: 0, y: 0 }, type: 'below' },
  setDropIndicator: () => {},
});

export const useDragDropContext = () => useContext(DragDropContextValue);

interface EnhancedDragDropProviderProps {
  children: React.ReactNode;
  onDragStart?: (event: DragStartEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragMove?: (event: DragMoveEvent) => void;
}

export function EnhancedDragDropProvider({
  children,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDragMove,
}: EnhancedDragDropProviderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState({
    show: false,
    position: { x: 0, y: 0 },
    type: 'below' as 'above' | 'below' | 'inside',
  });

  // Enhanced sensors with keyboard support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    onDragStart?.(event);
  }, [onDragStart]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
    onDragOver?.(event);
  }, [onDragOver]);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    // Enhanced drop indicator positioning
    if (event.over) {
      const rect = event.over.rect;
      // Type cast the activator event to access clientY safely
      const pointerEvent = event.activatorEvent as PointerEvent | MouseEvent;
      const pointerY = pointerEvent?.clientY || 0;
      
      if (rect) {
        const midpoint = rect.top + rect.height / 2;
        const type = pointerY < midpoint ? 'above' : 'below';
        
        setDropIndicator({
          show: true,
          position: {
            x: rect.left,
            y: type === 'above' ? rect.top : rect.bottom,
          },
          type,
        });
      }
    } else {
      setDropIndicator(prev => ({ ...prev, show: false }));
    }
    
    onDragMove?.(event);
  }, [onDragMove]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    setOverId(null);
    setDropIndicator(prev => ({ ...prev, show: false }));
    onDragEnd?.(event);
  }, [onDragEnd]);

  const contextValue: DragDropContextType = {
    activeId,
    overId,
    dropIndicator,
    setDropIndicator,
  };

  return (
    <DragDropContextValue.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements: {
            onDragStart({ active }) {
              return `Picked up draggable item ${active.id}.`;
            },
            onDragOver({ active, over }) {
              if (over) {
                return `Draggable item ${active.id} was moved over droppable area ${over.id}.`;
              }
              return `Draggable item ${active.id} is no longer over a droppable area.`;
            },
            onDragEnd({ active, over }) {
              if (over) {
                return `Draggable item ${active.id} was dropped over droppable area ${over.id}`;
              }
              return `Draggable item ${active.id} was dropped.`;
            },
            onDragCancel({ active }) {
              return `Dragging was cancelled. Draggable item ${active.id} was dropped.`;
            },
          },
        }}
      >
        {children}
      </DndContext>
    </DragDropContextValue.Provider>
  );
}
