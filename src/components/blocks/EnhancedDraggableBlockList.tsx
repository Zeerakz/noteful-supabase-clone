
import React, { useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Block } from '@/types/block';
import { BlockRenderer } from './BlockRenderer';
import { EnhancedDragDropProvider } from '@/contexts/DragDropContext';
import { EnhancedDropIndicator } from '@/components/dnd/EnhancedDropIndicator';
import { VirtualizedDragDropList } from '@/components/dnd/VirtualizedDragDropList';

interface EnhancedDraggableBlockListProps {
  blocks: Block[];
  pageId: string;
  onUpdateBlock: (id: string, updates: any) => Promise<{ data: any; error: string | null }>;
  onDeleteBlock: (id: string) => Promise<void>;
  onCreateBlock?: (params: any) => Promise<void>;
  isEditable: boolean;
  childBlocks?: Block[];
  parentBlockId?: string;
  onReportError?: (blockId: string, error: Error) => void;
  onRetry?: () => void;
}

export function EnhancedDraggableBlockList({
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
}: EnhancedDraggableBlockListProps) {
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !isEditable) return;

    const activeIndex = blocks.findIndex(block => block.id === active.id);
    const overIndex = blocks.findIndex(block => block.id === over.id);

    if (activeIndex === -1 || overIndex === -1) return;

    console.log('🔄 Enhanced drag and drop - moving block from', activeIndex, 'to', overIndex);

    try {
      // Reorder blocks array
      const reorderedBlocks = arrayMove(blocks, activeIndex, overIndex);

      // Update positions for all affected blocks
      const updatePromises = reorderedBlocks.map(async (block, index) => {
        if (block.pos !== index) {
          console.log(`📍 Updating block ${block.id} position from ${block.pos} to ${index}`);
          const result = await onUpdateBlock(block.id, { pos: index });
          if (result.error) {
            throw new Error(result.error);
          }
        }
      });

      await Promise.all(updatePromises);
      console.log('✅ Enhanced drag and drop completed successfully');
    } catch (error) {
      console.error('❌ Error during enhanced drag and drop:', error);
      onReportError?.('drag-drop', error as Error);
    }
  }, [blocks, isEditable, onUpdateBlock, onReportError]);

  const renderBlock = useCallback((block: Block, index: number) => (
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
  ), [pageId, onUpdateBlock, onDeleteBlock, onCreateBlock, isEditable, childBlocks, onReportError, onRetry]);

  const getBlockId = useCallback((block: Block) => block.id, []);

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
    <EnhancedDragDropProvider onDragEnd={handleDragEnd}>
      <div className="relative">
        <VirtualizedDragDropList
          items={blocks}
          renderItem={renderBlock}
          getItemId={getBlockId}
          height={600} // Adjust based on your needs
          itemHeight={80} // Approximate block height
          className="space-y-2 min-h-[16px]"
        />
        <EnhancedDropIndicator />
      </div>
    </EnhancedDragDropProvider>
  );
}
