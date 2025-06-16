
import { useCallback, useEffect } from 'react';
import { useEnhancedBlocks } from '@/hooks/useEnhancedBlocks';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';
import { Block } from '@/types/block';

export function useEnhancedBlocksWithRealtime(pageId?: string, workspaceId?: string) {
  const blocksHook = useEnhancedBlocks(pageId, workspaceId);
  const { subscribe, addGlobalListener } = useRealtimeManager();

  // Handle workspace-wide subscriptions for new blocks
  useEffect(() => {
    if (!workspaceId) return;

    console.log('🔗 Setting up workspace subscription for blocks:', workspaceId);

    const unsubscribeWorkspace = subscribe('workspace', workspaceId, {
      onBlockChange: (payload) => {
        console.log('📥 Workspace block change:', payload);
        
        const newBlock = payload.new as Block;
        const eventType = payload.eventType;

        // If it's a new block, refresh the blocks to pick it up
        if (eventType === 'INSERT' && newBlock) {
          console.log('✨ New block created, refreshing blocks list');
          // Small delay to ensure the block is fully created
          setTimeout(() => {
            blocksHook.fetchBlocks();
          }, 100);
        }

        // If it's an update or delete, also refresh
        if (eventType === 'UPDATE' || eventType === 'DELETE') {
          console.log('📝 Block updated/deleted, refreshing blocks list');
          setTimeout(() => {
            blocksHook.fetchBlocks();
          }, 100);
        }
      },
    });

    return unsubscribeWorkspace;
  }, [workspaceId, subscribe, blocksHook.fetchBlocks]);

  // Global listener for cross-component coordination
  useEffect(() => {
    const unsubscribeGlobal = addGlobalListener((event) => {
      const { type, id, payload } = event.detail;
      
      if (type === 'workspace' && id === workspaceId) {
        const block = payload.new as Block;
        
        if (payload.eventType === 'INSERT' && block) {
          console.log('🌍 Global: New block detected, coordinating refresh');
          // Trigger refresh for any components that need it
          window.dispatchEvent(new CustomEvent('blockCreated', {
            detail: { block, workspaceId }
          }));
        }
      }
    });

    return unsubscribeGlobal;
  }, [addGlobalListener, workspaceId]);

  return blocksHook;
}
