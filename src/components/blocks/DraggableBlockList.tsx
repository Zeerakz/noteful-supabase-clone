
import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Block } from '@/types/block';
import { BlockRenderer } from './BlockRenderer';
import { GripVertical } from 'lucide-react';

interface DraggableBlockListProps {
  blocks: Block[];
  pageId: string;
  onUpdateBlock: (id: string, updates: any) => Promise<void>;
  onDeleteBlock: (id: string) => Promise<void>;
  onCreateBlock?: (params: any) => Promise<void>;
  isEditable: boolean;
  childBlocks?: Block[];
  parentBlockId?: string;
  onReportError?: (blockId: string, error: Error) => void;
  onRetry?: () => void;
}

export function DraggableBlockList({
  blocks,
  pageId,
  onUpdateBlock,
  onDeleteBlock,
  onCreateBlock,
  isEditable,
  childBlocks = [],
  parentBlockId,
  onReportError,
  onRetry,
}: DraggableBlockListProps) {
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !isEditable) return;

    const { source, destination } = result;
    
    // Don't do anything if dropped in the same position
    if (source.index === destination.index) return;

    console.log('🔄 Drag and drop - moving block from', source.index, 'to', destination.index);

    try {
      // Create a copy of blocks array for reordering
      const reorderedBlocks = Array.from(blocks);
      const [draggedBlock] = reorderedBlocks.splice(source.index, 1);
      reorderedBlocks.splice(destination.index, 0, draggedBlock);

      // Update positions for all affected blocks in batch
      const updatePromises = reorderedBlocks.map((block, index) => {
        if (block.pos !== index) {
          console.log(`📍 Updating block ${block.id} position from ${block.pos} to ${index}`);
          return onUpdateBlock(block.id, { pos: index });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      console.log('✅ Drag and drop completed successfully');
    } catch (error) {
      console.error('❌ Error during drag and drop:', error);
      onReportError?.('drag-drop', error as Error);
    }
  };

  if (!isEditable) {
    // Render without drag functionality for non-editable mode
    return (
      <div className="space-y-2">
        {blocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            pageId={pageId}
            onUpdateBlock={onUpdateBlock}
            onDeleteBlock={onDeleteBlock}
            onCreateBlock={onCreateBlock}
            isEditable={isEditable}
            childBlocks={childBlocks}
            onReportError={onReportError}
            onRetry={onRetry}
          />
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={parentBlockId || `page-${pageI'}`}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 min-h-[16px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-muted/20 rounded-md p-2' : ''
            }`}
          >
            {blocks.map((block, index) => (
              <Draggable
                key={block.id}
                draggableId={block.id}
                index={index}
                isDragDisabled={!isEditable}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`transition-all duration-200 ${
                      snapshot.isDragging
                        ? 'shadow-lg ring-2 ring-primary/20 bg-background rounded-md scale-[1.01] rotate-0.5 z-50'
                        : ''
                    }`}
                    style={{
                      ...provided.draggableProps.style,
                    }}
                  >
                    <div className="group relative">
                      {/* Drag handle - more subtle */}
                      <div
                        {...provided.dragHandleProps}
                        className={`absolute left-0 top-1 -translate-x-6 w-5 h-5 rounded bg-background border border-border hover:bg-muted cursor-grab active:cursor-grabbing transition-all duration-200 flex items-center justify-center ${
                          snapshot.isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <GripVertical className="w-3 h-3 text-muted-foreground" />
                      </div>
                      
                      <BlockRenderer
                        block={block}
                        pageId={pageId}
                        onUpdateBlock={onUpdateBlock}
                        onDeleteBlock={onDeleteBlock}
                        onCreateBlock={onCreateBlock}
                        isEditable={isEditable}
                        childBlocks={childBlocks}
                        onReportError={onReportError}
                        onRetry={onRetry}
                      />
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {/* Drop zone indicator when dragging */}
            {snapshot.isDraggingOver && blocks.length === 0 && (
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-md p-6 text-center text-muted-foreground text-sm bg-muted/5">
                Drop block here
              </div>
            )}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
