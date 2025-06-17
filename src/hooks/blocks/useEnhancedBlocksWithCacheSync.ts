
import { useCallback } from 'react';
import { useBlocksWithCacheSync } from './useBlocksWithCacheSync';
import { BlocksQueryFilters } from './queryKeys';

interface UseEnhancedBlocksWithCacheSyncOptions {
  filters?: BlocksQueryFilters;
  enabled?: boolean;
  refetchInterval?: number;
  enableRealtimeSync?: boolean;
}

export function useEnhancedBlocksWithCacheSync(
  pageId?: string,
  workspaceId?: string,
  options: UseEnhancedBlocksWithCacheSyncOptions = {}
) {
  const blocksHook = useBlocksWithCacheSync(workspaceId, pageId, options);

  // Simplified fetchBlocks function for backwards compatibility
  const fetchBlocks = useCallback(() => {
    blocksHook.refreshBlocks();
  }, [blocksHook]);

  return {
    blocks: blocksHook.blocks,
    loading: blocksHook.loading,
    error: blocksHook.error,
    createBlock: blocksHook.createBlock,
    updateBlock: blocksHook.updateBlock,
    deleteBlock: blocksHook.deleteBlock,
    fetchBlocks,
    hasOptimisticChanges: false,
    isRealtimeConnected: blocksHook.isRealtimeConnected,
    realtimeError: blocksHook.realtimeError,
    retryRealtime: blocksHook.retryRealtime,
  };
}
