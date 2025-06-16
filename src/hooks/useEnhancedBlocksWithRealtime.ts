
import { useCallback, useEffect } from 'react';
import { useEnhancedBlocks } from '@/hooks/useEnhancedBlocks';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';
import { Block } from '@/types/block';

export function useEnhancedBlocksWithRealtime(pageId?: string, workspaceId?: string) {
  const blocksHook = useEnhancedBlocks(pageId, workspaceId);
  const { subscribe } = useRealtimeSubscriptions();

  // Handle realtime updates for blocks
  const handleBlockUpdate = useCallback((payload: any) => {
    const { eventType, new: newBlock, old: oldBlock } = payload;
    
    console.log('📥 Block realtime update:', { eventType, pageId, workspaceId });

    // Filter updates to only relevant blocks
    const isRelevantBlock = (block: any) => {
      if (!block) return false;
      
      // If we have a specific pageId, only process blocks for that page
      if (pageId && block.parent_id !== pageId) {
        return false;
      }
      
      // If we have a workspaceId, only process blocks for that workspace
      if (workspaceId && block.workspace_id !== workspaceId) {
        return false;
      }
      
      return true;
    };

    // Check if this update is relevant to our current context
    const relevantBlock = newBlock || oldBlock;
    if (!isRelevantBlock(relevantBlock)) {
      return;
    }

    // Refresh blocks data to get latest state
    console.log('🔄 Refreshing blocks due to realtime update');
    setTimeout(() => {
      blocksHook.fetchBlocks();
    }, 100);
  }, [pageId, workspaceId, blocksHook.fetchBlocks]);

  // Subscribe to workspace-wide block changes
  useEffect(() => {
    if (!workspaceId) return;

    console.log('🔗 Setting up workspace block subscription:', workspaceId);

    const unsubscribe = subscribe(
      {
        table: 'blocks',
        filter: `workspace_id=eq.${workspaceId}`,
        event: '*'
      },
      handleBlockUpdate
    );

    return unsubscribe;
  }, [workspaceId, subscribe, handleBlockUpdate]);

  return blocksHook;
}
