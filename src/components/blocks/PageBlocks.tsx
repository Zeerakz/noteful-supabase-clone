
import React from 'react';
import { useEnhancedBlocks } from '@/hooks/useEnhancedBlocks';
import { DraggableBlockList } from './DraggableBlockList';

interface PageBlocksProps {
  pageId: string;
  isEditable?: boolean;
}

export function PageBlocks({ pageId, isEditable = false }: PageBlocksProps) {
  const { blocks, loading, error, createBlock, updateBlock, deleteBlock } = useEnhancedBlocks(pageId);

  const handleUpdateBlock = async (id: string, updates: any) => {
    await updateBlock(id, updates);
  };

  const handleDeleteBlock = async (id: string) => {
    await deleteBlock(id);
  };

  const handleCreateBlock = async (type: string, content?: any, parentBlockId?: string) => {
    await createBlock(type, content, parentBlockId);
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

  // Filter blocks by parent relationship
  const parentBlocks = blocks.filter(block => !block.parent_block_id);
  const childBlocks = blocks.filter(block => block.parent_block_id);

  return (
    <DraggableBlockList
      blocks={parentBlocks}
      onUpdateBlock={handleUpdateBlock}
      onDeleteBlock={handleDeleteBlock}
      onCreateBlock={handleCreateBlock}
      isEditable={isEditable}
      childBlocks={childBlocks}
    />
  );
}
