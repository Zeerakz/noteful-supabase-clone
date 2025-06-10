
import React from 'react';
import { BlockRenderer } from './BlockRenderer';
import { useBlocks } from '@/hooks/useBlocks';

interface PageBlocksProps {
  pageId: string;
  isEditable?: boolean;
}

interface DraggableItem {
  id: string;
  content: React.ReactNode;
}

export function PageBlocks({ pageId, isEditable = false }: PageBlocksProps) {
  const { blocks, loading, error, updateBlock, deleteBlock } = useBlocks(pageId);

  const handleUpdateBlock = async (id: string, updates: any) => {
    const { error } = await updateBlock(id, updates);
    if (error) {
      console.error('Failed to update block:', error);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    const { error } = await deleteBlock(id);
    if (error) {
      console.error('Failed to delete block:', error);
    }
  };

  const handleDrop = async (draggedItemId: string, targetItemId: string, position: 'before' | 'after') => {
    if (!isEditable) return;

    const draggedBlock = blocks.find(b => b.id === draggedItemId);
    const targetBlock = blocks.find(b => b.id === targetItemId);
    
    if (!draggedBlock || !targetBlock) return;

    // Calculate new position
    const targetPos = targetBlock.pos;
    let newPos: number;
    
    if (position === 'before') {
      newPos = targetPos - 0.5;
    } else {
      newPos = targetPos + 0.5;
    }

    // Update the dragged block's position and parent
    await handleUpdateBlock(draggedItemId, {
      pos: newPos,
      parent_block_id: targetBlock.parent_block_id
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <p>Error loading blocks: {error}</p>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        {isEditable ? 'No blocks yet. Start adding content!' : 'This page is empty.'}
      </div>
    );
  }

  // Convert blocks to draggable items
  const draggableItems: DraggableItem[] = blocks.map((block) => ({
    id: block.id,
    content: (
      <BlockRenderer
        key={block.id}
        block={block}
        onUpdateBlock={handleUpdateBlock}
        onDeleteBlock={handleDeleteBlock}
        isEditable={isEditable}
      />
    )
  }));

  if (!isEditable) {
    // If not editable, render without drag functionality
    return (
      <div className="space-y-2">
        {blocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            isEditable={isEditable}
          />
        ))}
      </div>
    );
  }

  // For editable mode, we need to implement a simple draggable list
  // Since Lovable's specific Draggable List component isn't available in the current context,
  // I'll create a basic drag and drop implementation
  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          draggable={isEditable}
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', block.id);
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('text/plain');
            if (draggedId !== block.id) {
              handleDrop(draggedId, block.id, 'after');
            }
          }}
          className={isEditable ? 'cursor-move' : ''}
        >
          <BlockRenderer
            block={block}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            isEditable={isEditable}
          />
        </div>
      ))}
    </div>
  );
}
