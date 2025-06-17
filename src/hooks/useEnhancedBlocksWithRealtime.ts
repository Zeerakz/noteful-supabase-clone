
import { useCallback } from 'react';
import { useEnhancedBlocks } from '@/hooks/useEnhancedBlocks';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';

export function useEnhancedBlocksWithRealtime(pageId?: string, workspaceId?: string) {
  const blocksHook = useEnhancedBlocks(pageId, workspaceId);
  const { subscribe } = useRealtimeManager();

  const handleBlockChange = useCallback((payload: any) => {
    const { new: newBlock, old: oldBlock } = payload;
    const block = newBlock || oldBlock;
    
    // Only refresh if this change affects our page
    if (block && (block.parent_id === pageId || block.id === pageId)) {
      console.log('📥 Block change detected for current page, refreshing blocks...');
      setTimeout(() => {
        blocksHook.fetchBlocks();
      }, 50);
    }
  }, [pageId, blocksHook]);

  // Use the centralized realtime manager instead of direct subscription
  if (pageId && workspaceId) {
    subscribe('page', pageId, {
      onBlockChange: handleBlockChange,
    });
  }

  return blocksHook;
}
