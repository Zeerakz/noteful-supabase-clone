
import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { EnhancedSortableList, EnhancedSortableItem } from './EnhancedSortableItem';

interface VirtualizedDragDropListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemId: (item: T) => string;
  height: number;
  itemHeight: number;
  onReorder?: (activeId: string, overId: string) => void;
  className?: string;
  overscan?: number;
}

export function VirtualizedDragDropList<T>({
  items,
  renderItem,
  getItemId,
  height,
  itemHeight,
  onReorder,
  className,
  overscan = 5,
}: VirtualizedDragDropListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  const itemIds = useMemo(() => items.map(getItemId), [items, getItemId]);

  // Only render if we have a large number of items (performance optimization)
  const shouldVirtualize = items.length > 100;

  if (!shouldVirtualize) {
    return (
      <EnhancedSortableList items={itemIds} className={className}>
        {items.map((item, index) => (
          <EnhancedSortableItem key={getItemId(item)} id={getItemId(item)}>
            {renderItem(item, index)}
          </EnhancedSortableItem>
        ))}
      </EnhancedSortableList>
    );
  }

  return (
    <div
      ref={parentRef}
      className={className}
      style={{ height, overflow: 'auto' }}
      role="list"
      aria-label="Virtualized sortable list"
    >
      <EnhancedSortableList items={itemIds}>
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const item = items[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: virtualItem.size,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <EnhancedSortableItem id={getItemId(item)}>
                  {renderItem(item, virtualItem.index)}
                </EnhancedSortableItem>
              </div>
            );
          })}
        </div>
      </EnhancedSortableList>
    </div>
  );
}
