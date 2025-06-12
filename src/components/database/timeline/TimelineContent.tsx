
import React from 'react';
import { Droppable, Draggable, DragDropContext } from 'react-beautiful-dnd';
import { TimelineItem, TimelineViewMode } from './types';
import { TimelineCard } from './TimelineCard';
import { TimelineGrid } from './TimelineGrid';
import { DatabaseField } from '@/types/database';

interface TimelineContentProps {
  items: TimelineItem[];
  fields: DatabaseField[];
  viewMode: TimelineViewMode;
  startDate: Date;
  endDate: Date;
  onDragEnd: (result: any) => void;
}

export function TimelineContent({
  items,
  fields,
  viewMode,
  startDate,
  endDate,
  onDragEnd
}: TimelineContentProps) {
  const getItemPosition = (item: TimelineItem) => {
    const totalRange = endDate.getTime() - startDate.getTime();
    const itemStart = item.startDate.getTime() - startDate.getTime();
    const leftPercent = (itemStart / totalRange) * 100;
    
    let widthPercent = 0;
    if (item.endDate) {
      const duration = item.endDate.getTime() - item.startDate.getTime();
      widthPercent = (duration / totalRange) * 100;
    }
    
    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: widthPercent > 0 ? `${widthPercent}%` : 'auto',
      minWidth: widthPercent > 0 ? undefined : '200px'
    };
  };

  // Group overlapping items into lanes
  const arrangeItemsInLanes = (items: TimelineItem[]) => {
    const lanes: TimelineItem[][] = [];
    const sortedItems = [...items].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    for (const item of sortedItems) {
      let placed = false;
      
      for (let i = 0; i < lanes.length; i++) {
        const lane = lanes[i];
        const lastItem = lane[lane.length - 1];
        
        // Check if item can fit in this lane (no overlap)
        const lastItemEnd = lastItem.endDate || lastItem.startDate;
        if (item.startDate >= lastItemEnd) {
          lane.push(item);
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        lanes.push([item]);
      }
    }
    
    return lanes;
  };

  const lanes = arrangeItemsInLanes(items);
  const laneHeight = 120; // Height per lane in pixels

  if (items.length === 0) {
    return (
      <TimelineGrid 
        viewMode={viewMode} 
        startDate={startDate} 
        endDate={endDate} 
        items={items}
      >
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No items to display. Make sure you have selected a date field and have data with valid dates.
        </div>
      </TimelineGrid>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <TimelineGrid 
        viewMode={viewMode} 
        startDate={startDate} 
        endDate={endDate} 
        items={items}
      >
        <Droppable droppableId="timeline" direction="vertical">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ height: lanes.length * laneHeight }}
              className="relative"
            >
              {lanes.map((lane, laneIndex) => (
                <div key={laneIndex} className="absolute w-full" style={{ 
                  top: laneIndex * laneHeight,
                  height: laneHeight
                }}>
                  {lane.map((item, itemIndex) => (
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={laneIndex * 1000 + itemIndex} // Ensure unique index
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="absolute"
                          style={{
                            ...getItemPosition(item),
                            top: '10px',
                            ...provided.draggableProps.style,
                          }}
                        >
                          <TimelineCard
                            item={item}
                            fields={fields}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </TimelineGrid>
    </DragDropContext>
  );
}
