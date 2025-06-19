
import React from 'react';
import { useDragDropContext } from '@/contexts/DragDropContext';
import { cn } from '@/lib/utils';

interface EnhancedDropIndicatorProps {
  className?: string;
}

export function EnhancedDropIndicator({ className }: EnhancedDropIndicatorProps) {
  const { dropIndicator } = useDragDropContext();

  if (!dropIndicator.show) return null;

  return (
    <div
      className={cn(
        "fixed z-50 pointer-events-none transition-all duration-150",
        "h-0.5 bg-blue-500 shadow-lg",
        "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
        "before:w-2 before:h-2 before:bg-blue-500 before:rounded-full",
        "after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2",
        "after:w-2 after:h-2 after:bg-blue-500 after:rounded-full",
        className
      )}
      style={{
        left: dropIndicator.position.x,
        top: dropIndicator.position.y,
        width: '200px', // Adjust based on your needs
      }}
      role="presentation"
      aria-hidden="true"
    />
  );
}
