
import React from 'react';
import { useEnhancedBlocks } from '@/hooks/useEnhancedBlocks';
import { DraggableBlockList } from './DraggableBlockList';
import { Block, BlockType } from '@/types/block';
import { useToast } from '@/hooks/use-toast';

interface PageBlocksProps {
  workspaceId: string;
  pageId: string;
  isEditable?: boolean;
}

export function PageBlocks({ workspaceId, pageId, isEditable = false }: PageBlocksProps) {
  const { 
    blocks, 
    loading, 
    error, 
    createBlock, 
    updateBlock, 
    deleteBlock,
    hasOptimisticChanges 
  } = useEnhancedBlocks(pageId, workspaceId);
  const { toast } = useToast();

  const handleUpdateBlock = async (id: string, updates: any) => {
    try {
      const { error } = await updateBlock(id, updates);
      if (error) {
        console.error('Failed to update block:', error);
        // Error handling is done in useEnhancedBlocks
      }
    } catch (err) {
      console.error('Unexpected error updating block:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the block.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      const { error } = await deleteBlock(id);
      if (error) {
        console.error('Failed to delete block:', error);
        // Error handling is done in useEnhancedBlocks
      }
    } catch (err) {
      console.error('Unexpected error deleting block:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the block.",
        variant: "destructive",
      });
    }
  };

  const handleCreateBlock = async (params: { type: BlockType; content?: any; parent_id?: string; pos?: number }) => {
    try {
      const { error } = await createBlock(params.type, params.content, params.parent_id);
      if (error) {
        console.error('Failed to create block:', error);
        // Error handling is done in useEnhancedBlocks
      }
    } catch (err) {
      console.error('Unexpected error creating block:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the block.",
        variant: "destructive",
      });
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
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-blue-600 underline"
        >
          Refresh page
        </button>
      </div>
    );
  }

  if (blocks.length === 0 && !loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        {isEditable ? 'No blocks yet. Start adding content!' : 'This page is empty.'}
        {hasOptimisticChanges && (
          <div className="mt-2 text-xs text-blue-600 flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Syncing changes...
          </div>
        )}
      </div>
    );
  }

  const parentBlocks = blocks.filter(block => block.parent_id === pageId);
  const childBlocks = blocks.filter(block => block.parent_id && block.parent_id !== pageId);

  return (
    <div className="relative">
      {hasOptimisticChanges && (
        <div className="absolute top-0 right-4 z-10 text-xs text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          Syncing...
        </div>
      )}
      <DraggableBlockList
        blocks={parentBlocks}
        pageId={pageId}
        onUpdateBlock={handleUpdateBlock}
        onDeleteBlock={handleDeleteBlock}
        onCreateBlock={handleCreateBlock}
        isEditable={isEditable}
        childBlocks={childBlocks}
      />
    </div>
  );
}
