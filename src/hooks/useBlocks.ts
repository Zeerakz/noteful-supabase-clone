
import { useCallback } from 'react';
import { useBlockOperations } from './blocks/useBlockOperations';
import { useBlockRealtimeSubscription } from './blocks/useBlockRealtimeSubscription';
import { Block } from './blocks/types';

export type { Block } from './blocks/types';

export function useBlocks(workspaceId?: string, pageId?: string) {
  const {
    blocks,
    setBlocks,
    loading,
    error,
    refetch: fetchBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
  } = useBlockOperations(workspaceId, pageId);

  const handleBlockInsert = useCallback((newBlock: Block) => {
    setBlocks(prev => {
      if (prev.some(block => block.id === newBlock.id)) {
        return prev;
      }
      return [...prev, newBlock].sort((a, b) => (a.pos || 0) - (b.pos || 0));
    });
  }, [setBlocks]);

  const handleBlockUpdate = useCallback((updatedBlock: Block) => {
    setBlocks(prev => prev.map(block => 
      block.id === updatedBlock.id ? updatedBlock : block
    ).sort((a, b) => (a.pos || 0) - (b.pos || 0)));
  }, [setBlocks]);

  const handleBlockDelete = useCallback((deletedBlock: Block) => {
    setBlocks(prev => prev.filter(block => block.id !== deletedBlock.id));
  }, [setBlocks]);

  useBlockRealtimeSubscription({
    pageId,
    onBlockInsert: handleBlockInsert,
    onBlockUpdate: handleBlockUpdate,
    onBlockDelete: handleBlockDelete,
  });

  return {
    blocks,
    loading,
    error,
    fetchBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
  };
}
