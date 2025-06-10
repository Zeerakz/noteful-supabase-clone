
import React from 'react';
import { BlockRenderer } from './BlockRenderer';
import { useBlocks } from '@/hooks/useBlocks';

interface PageBlocksProps {
  pageId: string;
  isEditable?: boolean;
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
