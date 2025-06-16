
import { useCallback, useEffect } from 'react';
import { useEnhancedBlocks } from '@/hooks/useEnhancedBlocks';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';
import { Block } from '@/types/block';

export function useEnhancedBlocksWithRealtime(pageId?: string, workspaceId?: string) {
  const blocksHook = useEnhancedBlocks(pageId, workspaceId);
  const { subscribe, addGlobalListener } = useRealtimeManager();

  // Handle direct page subscriptions (for immediate children)
  useEffect(() => {
    if (!pageId) return;

    const unsubscribePage = subscribe('page', pageId, {
      onBlockChange: (payload) => {
        console.log('📥 Page-level block change:', payload);
        // The existing useBlockOperations already handles this via its own subscription
        // This is mainly for coordination and debugging
      },
    });

    return unsubscribePage;
  }, [pageId, subscribe]);

  // Handle workspace-wide subscriptions for new pages and hierarchical updates
  useEffect(() => {
    if (!workspaceId) return;

    const unsubscribeWorkspace = subscribe('workspace', workspaceId, {
      onBlockChange: (payload) => {
        // Handle new pages or blocks that might affect the current page
        const newBlock = payload.new as Block;
        const oldBlock = payload.old as Block;

        // If it's a new page, we might need to refresh our page list
        if (payload.eventType === 'INSERT' && newBlock?.type === 'page') {
          console.log('📄 New page created in workspace:', newBlock);
          // Trigger a refresh of the page list if needed
          // This will be handled by the pages hook
        }

        // If it's a block that might be nested under our current page
        if (pageId && newBlock && isDescendantBlock(newBlock, pageId)) {
          console.log('🔗 Descendant block change detected:', newBlock);
          // The block operations hook should handle this, but we can force a refresh if needed
          blocksHook.fetchBlocks();
        }
      },
      onPageChange: (payload) => {
        console.log('📄 Page change in workspace:', payload);
        // This will be handled by the pages hook
      },
    });

    return unsubscribeWorkspace;
  }, [workspaceId, pageId, subscribe, blocksHook.fetchBlocks]);

  // Global listener for cross-component coordination
  useEffect(() => {
    const unsubscribeGlobal = addGlobalListener((event) => {
      const { type, id, payload } = event.detail;
      
      // Handle events that might affect our current page
      if (type === 'workspace' && id === workspaceId) {
        const block = payload.new as Block;
        
        // If a new page was created, we might need to update navigation
        if (payload.eventType === 'INSERT' && block?.type === 'page') {
          console.log('🌍 Global: New page in workspace detected');
          // This will trigger updates in other components like sidebar
        }
      }
    });

    return unsubscribeGlobal;
  }, [addGlobalListener, workspaceId]);

  return blocksHook;
}

// Helper function to check if a block is a descendant of a given page
function isDescendantBlock(block: Block, pageId: string): boolean {
  // This is a simplified check - in a real implementation, you might need
  // to traverse the hierarchy more thoroughly
  return block.parent_id === pageId || 
         (block.parent_id !== null && block.parent_id !== pageId);
}
