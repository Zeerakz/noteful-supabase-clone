
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { blocksQueryKeys } from './queryKeys';
import { Block } from '@/types/block';

interface UseBlockCacheSyncParams {
  workspaceId?: string;
  pageId?: string;
  enabled?: boolean;
}

export function useBlockCacheSync({
  workspaceId,
  pageId,
  enabled = true
}: UseBlockCacheSyncParams) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Helper function to update cache for all relevant query keys
  const updateCacheForBlock = useCallback((block: Block, operation: 'insert' | 'update' | 'delete') => {
    if (!workspaceId || !pageId) return;

    const queryKey = blocksQueryKeys.page(workspaceId, pageId);
    
    queryClient.setQueryData<Block[]>(queryKey, (oldBlocks) => {
      if (!oldBlocks) return oldBlocks;

      switch (operation) {
        case 'insert':
          // Add the new block in the correct position based on pos
          const insertIndex = oldBlocks.findIndex(b => b.pos > block.pos);
          if (insertIndex === -1) {
            return [...oldBlocks, block];
          }
          return [
            ...oldBlocks.slice(0, insertIndex),
            block,
            ...oldBlocks.slice(insertIndex)
          ];

        case 'update':
          return oldBlocks.map(existingBlock => 
            existingBlock.id === block.id ? block : existingBlock
          );

        case 'delete':
          return oldBlocks.filter(existingBlock => existingBlock.id !== block.id);

        default:
          return oldBlocks;
      }
    });

    // Also update any filtered query caches
    queryClient.invalidateQueries({
      queryKey: blocksQueryKeys.workspace(workspaceId),
      exact: false
    });
  }, [queryClient, workspaceId, pageId]);

  // Realtime subscription callbacks
  const handleBlockInsert = useCallback((payload: any) => {
    const newBlock = payload.new as Block;
    
    // Only sync if this block belongs to our current page
    if (newBlock.parent_id === pageId && newBlock.workspace_id === workspaceId) {
      console.log('📥 Syncing block insert to cache:', newBlock.id);
      updateCacheForBlock(newBlock, 'insert');
    }
  }, [pageId, workspaceId, updateCacheForBlock]);

  const handleBlockUpdate = useCallback((payload: any) => {
    const updatedBlock = payload.new as Block;
    
    // Only sync if this block belongs to our current page
    if (updatedBlock.parent_id === pageId && updatedBlock.workspace_id === workspaceId) {
      console.log('📥 Syncing block update to cache:', updatedBlock.id);
      updateCacheForBlock(updatedBlock, 'update');
    }
  }, [pageId, workspaceId, updateCacheForBlock]);

  const handleBlockDelete = useCallback((payload: any) => {
    const deletedBlock = payload.old as Block;
    
    // Only sync if this block belonged to our current page
    if (deletedBlock.parent_id === pageId && deletedBlock.workspace_id === workspaceId) {
      console.log('📥 Syncing block delete to cache:', deletedBlock.id);
      updateCacheForBlock(deletedBlock, 'delete');
    }
  }, [pageId, workspaceId, updateCacheForBlock]);

  // Set up realtime subscription
  const { isConnected, error, retry } = useSupabaseRealtime({
    type: 'blocks',
    filter: {
      workspace_id: workspaceId,
      parent_id: pageId,
    },
    callbacks: {
      onInsert: handleBlockInsert,
      onUpdate: handleBlockUpdate,
      onDelete: handleBlockDelete,
    },
    enabled: enabled && !!user && !!workspaceId && !!pageId,
  });

  return {
    isConnected,
    error,
    retry,
  };
}
