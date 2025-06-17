
import React from 'react';
import { useBlockOperations } from '@/hooks/blocks/useBlockOperations';
import { DraggableBlockList } from './DraggableBlockList';
import { Block, BlockType } from '@/types/block';

interface PageBlocksProps {
  workspaceId: string;
  pageId: string;
  isEditable?: boolean;
}

export function PageBlocks({ workspaceId, pageId, isEditable = false }: PageBlocksProps) {
  const { blocks, loading, error, createBlock, updateBlock, deleteBlock } = useBlockOperations(workspaceId, pageId);

  const handleUpdateBlock = async (id: string, updates: any) => {
    try {
      await updateBlock(id, updates);
    } catch (error) {
      console.error('Error updating block:', error);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      await deleteBlock(id);
    } catch (error) {
      console.error('Error deleting block:', error);
    }
  };

  const handleCreateBlock = async (params: { type: BlockType; content?: any; parent_id?: string; pos?: number }) => {
    try {
      await createBlock(params);
    } catch (error) {
      console.error('Error creating block:', error);
    }
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

  if (blocks.length === 0 && !loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        {isEditable ? 'No blocks yet. Start adding content!' : 'This page is empty.'}
      </div>
    );
  }

  const parentBlocks = blocks.filter(block => block.parent_id === pageId);
  const childBlocks = blocks.filter(block => block.parent_id && block.parent_id !== pageId);

  return (
    <DraggableBlockList
      blocks={parentBlocks}
      pageId={pageId}
      onUpdateBlock={handleUpdateBlock}
      onDeleteBlock={handleDeleteBlock}
      onCreateBlock={handleCreateBlock}
      isEditable={isEditable}
      childBlocks={childBlocks}
    />
  );
}
