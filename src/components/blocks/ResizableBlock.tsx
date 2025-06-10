
import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { GripVertical, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ResizableBlockProps {
  children: React.ReactNode[];
  defaultSizes?: number[];
  minSize?: number;
  direction?: 'horizontal' | 'vertical';
  className?: string;
  showControls?: boolean;
  onSizeChange?: (sizes: number[]) => void;
}

export function ResizableBlock({
  children,
  defaultSizes = [50, 50],
  minSize = 15,
  direction = 'horizontal',
  className,
  showControls = true,
  onSizeChange
}: ResizableBlockProps) {
  const [sizes, setSizes] = useState(defaultSizes);

  const handleLayoutChange = (newSizes: number[]) => {
    setSizes(newSizes);
    onSizeChange?.(newSizes);
  };

  const handleSliderChange = (index: number, value: number[]) => {
    const newSizes = [...sizes];
    const oldValue = newSizes[index];
    const newValue = value[0];
    const difference = newValue - oldValue;
    
    // Adjust other panels proportionally
    const otherIndices = newSizes
      .map((_, i) => i)
      .filter(i => i !== index);
    
    const totalOthers = otherIndices.reduce((sum, i) => sum + newSizes[i], 0);
    
    if (totalOthers > 0) {
      otherIndices.forEach(i => {
        const proportion = newSizes[i] / totalOthers;
        newSizes[i] = Math.max(minSize, newSizes[i] - (difference * proportion));
      });
    }
    
    newSizes[index] = newValue;
    
    // Normalize to ensure they sum to 100
    const total = newSizes.reduce((sum, size) => sum + size, 0);
    const normalizedSizes = newSizes.map(size => (size / total) * 100);
    
    setSizes(normalizedSizes);
    onSizeChange?.(normalizedSizes);
  };

  if (children.length < 2) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative w-full", className)}>
      {showControls && (
        <div className="absolute top-2 right-2 z-10">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Panel Sizes</h4>
                {sizes.map((size, index) => (
                  <div key={index} className="space-y-2">
                    <Label>Panel {index + 1}: {Math.round(size)}%</Label>
                    <Slider
                      value={[size]}
                      onValueChange={(value) => handleSliderChange(index, value)}
                      max={100 - (minSize * (children.length - 1))}
                      min={minSize}
                      step={1}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      
      <ResizablePanelGroup
        direction={direction}
        className="h-full min-h-[200px]"
        onLayout={handleLayoutChange}
      >
        {children.map((child, index) => (
          <React.Fragment key={index}>
            <ResizablePanel
              defaultSize={sizes[index]}
              minSize={minSize}
              className="relative"
            >
              <div className="h-full p-3 border border-dashed border-border rounded-md">
                {child}
              </div>
            </ResizablePanel>
            {index < children.length - 1 && (
              <ResizableHandle 
                withHandle 
                className={cn(
                  direction === 'horizontal' ? 'w-2' : 'h-2',
                  "bg-border/50 hover:bg-border transition-colors"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </ResizablePanelGroup>
    </div>
  );
}
