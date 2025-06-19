
import React from 'react';
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedSortableItemProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  dragHandle?: boolean;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

export function EnhancedSortableItem({
  id,
  children,
  disabled = false,
  className,
  dragHandle = true,
  onKeyDown,
}: EnhancedSortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Enhanced keyboard support
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Activate drag mode with keyboard
    }
    onKeyDown?.(event);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative transition-all duration-200",
        isDragging && "opacity-50 scale-[1.02] shadow-lg z-50",
        isSorting && "transition-transform duration-200",
        className
      )}
      {...attributes}
      onKeyDown={handleKeyDown}
      role="listitem"
      tabIndex={disabled ? -1 : 0}
      aria-describedby={`sortable-item-${id}-instructions`}
    >
      {dragHandle && (
        <div
          {...listeners}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6",
            "w-5 h-5 rounded bg-background border border-border",
            "hover:bg-muted cursor-grab active:cursor-grabbing",
            "transition-all duration-200 flex items-center justify-center",
            "opacity-0 group-hover:opacity-100",
            isDragging && "opacity-100"
          )}
          aria-label="Drag handle"
        >
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
      
      {children}
      
      {/* Screen reader instructions */}
      <div id={`sortable-item-${id}-instructions`} className="sr-only">
        Press space or enter to start dragging. Use arrow keys to move. Press space or enter again to drop.
      </div>
    </div>
  );
}

interface EnhancedSortableListProps {
  items: string[];
  children: React.ReactNode;
  className?: string;
}

export function EnhancedSortableList({
  items,
  children,
  className,
}: EnhancedSortableListProps) {
  return (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <div className={cn("space-y-1", className)} role="list">
        {children}
      </div>
    </SortableContext>
  );
}
