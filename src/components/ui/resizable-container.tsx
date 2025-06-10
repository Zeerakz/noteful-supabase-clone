
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';

interface ResizableContainerProps {
  children: React.ReactNode[];
  className?: string;
  defaultSizes?: number[];
  minSize?: number;
  direction?: 'horizontal' | 'vertical';
  onResize?: (sizes: number[]) => void;
}

export function ResizableContainer({ 
  children, 
  className,
  defaultSizes = [50, 50],
  minSize = 20,
  direction = 'horizontal',
  onResize
}: ResizableContainerProps) {
  if (children.length < 2) {
    console.warn('ResizableContainer requires at least 2 children');
    return <div className={className}>{children}</div>;
  }

  return (
    <ResizablePanelGroup
      direction={direction}
      className={cn("w-full h-full", className)}
      onLayout={onResize}
    >
      {children.map((child, index) => (
        <React.Fragment key={index}>
          <ResizablePanel
            defaultSize={defaultSizes[index] || 50}
            minSize={minSize}
          >
            <div className="h-full p-2">
              {child}
            </div>
          </ResizablePanel>
          {index < children.length - 1 && (
            <ResizableHandle withHandle />
          )}
        </React.Fragment>
      ))}
    </ResizablePanelGroup>
  );
}
