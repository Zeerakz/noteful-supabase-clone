
import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Block } from '@/types/block';
import { BlockRenderer } from './BlockRenderer';

interface DraggableBlockListProps {
  blocks: Block[];
  pageId: string;
  onUpdateBlock: (id: string, updates: any) => Promise<void>;
  onDeleteBlock: (id: string) => Promise<void>;
  onCreateBlock?: (params: any) => Promise<void>;
  isEditable: boolean;
  childBlocks?: Block[];
  parentBlockId?: string;
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
}: DraggableBlockListProps) {
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !isEditable) return;

    const { source, destination } = result;
    
    // Don't do anything if dropped in the same position
    if (source.index === destination.index) return;

    const draggedBlock = blocks[source.index];
    const reorderedBlocks = Array.from(blocks);
    
    // Remove the dragged block from its original position
    reorderedBlocks.splice(source.index, 1);
    // Insert it at the new position
    reorderedBlocks.splice(destination.index, 0, draggedBlock);

    // Update positions for all affected blocks
    for (let i = 0; i < reorderedBlocks.length; i++) {
      const block = reorderedBlocks[i];
      if (block.pos !== i) {
        await onUpdateBlock(block.id, { pos: i });
      }
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
          />
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={parentBlockId || 'root'}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 ${
              snapshot.isDraggingOver ? 'bg-muted/20 rounded-lg p-2' : ''
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
                    {...provided.dragHandleProps}
                    className={`${
                      snapshot.isDragging
                        ? 'shadow-lg ring-2 ring-primary/20 bg-background rounded-lg'
                        : ''
                    }`}
                    style={{
                      ...provided.draggableProps.style,
                      transform: snapshot.isDragging
                        ? provided.draggableProps.style?.transform
                        : 'none',
                    }}
                  >
                    <BlockRenderer
                      block={block}
                      pageId={pageId}
                      onUpdateBlock={onUpdateBlock}
                      onDeleteBlock={onDeleteBlock}
                      onCreateBlock={onCreateBlock}
                      isEditable={isEditable}
                      childBlocks={childBlocks}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
