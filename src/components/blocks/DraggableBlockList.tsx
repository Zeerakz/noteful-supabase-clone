
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { BlockRenderer } from './BlockRenderer';
import { Block, BlockType } from '@/types/block';

interface DraggableBlockListProps {
  blocks: Block[];
  pageId: string;
  onUpdateBlock: (id: string, updates: any) => Promise<void>;
  onDeleteBlock: (id: string) => Promise<void>;
  onCreateBlock: (params: { type: BlockType; content?: any; parent_id?: string; pos?: number }) => Promise<void>;
  isEditable: boolean;
  childBlocks: Block[];
  hasOptimisticChanges?: boolean;
}

export function DraggableBlockList({
  blocks,
  pageId,
  onUpdateBlock,
  onDeleteBlock,
  onCreateBlock,
  isEditable,
  childBlocks,
  hasOptimisticChanges = false
}: DraggableBlockListProps) {
  const handleDragEnd = async (result: any) => {
    if (!result.destination || !isEditable) return;

    const { source, destination } = result;
    if (source.index === destination.index) return;

    // Calculate new position based on drag result
    const newPos = destination.index;
    const blockId = result.draggableId;

    await onUpdateBlock(blockId, { pos: newPos });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="blocks">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {blocks.map((block, index) => {
              const blockHasOptimisticChanges = block.id.startsWith('temp-') || hasOptimisticChanges;
              
              return (
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
                      className={`transition-all duration-200 ${
                        snapshot.isDragging ? 'opacity-50' : 'opacity-100'
                      }`}
                    >
                      <BlockRenderer
                        block={block}
                        pageId={pageId}
                        onUpdateBlock={onUpdateBlock}
                        onDeleteBlock={onDeleteBlock}
                        onCreateBlock={onCreateBlock}
                        isEditable={isEditable}
                        childBlocks={childBlocks}
                        hasOptimisticChanges={blockHasOptimisticChanges}
                      />
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
