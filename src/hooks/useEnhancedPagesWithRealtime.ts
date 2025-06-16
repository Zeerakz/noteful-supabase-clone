
import { useCallback, useEffect } from 'react';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';
import { Block } from '@/types/block';

export function useEnhancedPagesWithRealtime(workspaceId?: string) {
  const pagesHook = useEnhancedPages(workspaceId);
  const { subscribe } = useRealtimeSubscriptions();

  // Handle realtime updates for pages
  const handlePageUpdate = useCallback((payload: any) => {
    const { eventType, new: newBlock, old: oldBlock } = payload;
    
    console.log('📄 Page realtime update:', { eventType, workspaceId });

    // Filter updates to only page-type blocks
    const isPageBlock = (block: any) => {
      return block && block.type === 'page' && block.workspace_id === workspaceId;
    };

    const relevantBlock = newBlock || oldBlock;
    if (!isPageBlock(relevantBlock)) {
      return;
    }

    console.log('📄 Processing page update:', {
      eventType,
      pageTitle: relevantBlock.properties?.title,
      pageId: relevantBlock.id
    });

    // Refresh pages data to get latest state
    console.log('🔄 Refreshing pages due to realtime update');
    setTimeout(() => {
      pagesHook.fetchPages();
    }, 100);
  }, [workspaceId, pagesHook.fetchPages]);

  // Subscribe to workspace-wide page changes (page-type blocks)
  useEffect(() => {
    if (!workspaceId) return;

    console.log('🔗 Setting up workspace page subscription:', workspaceId);

    const unsubscribe = subscribe(
      {
        table: 'blocks',
        filter: `workspace_id=eq.${workspaceId}`,
        event: '*'
      },
      handlePageUpdate
    );

    return unsubscribe;
  }, [workspaceId, subscribe, handlePageUpdate]);

  return pagesHook;
}
