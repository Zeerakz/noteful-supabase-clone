
import { useCallback } from 'react';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';

export function useEnhancedPagesWithRealtime(workspaceId?: string) {
  const pagesHook = useEnhancedPages(workspaceId);
  const { subscribe } = useRealtimeManager();

  const handlePageChange = useCallback((payload: any) => {
    const { new: newPage, old: oldPage } = payload;
    const page = newPage || oldPage;
    
    // Only refresh if this change affects our workspace
    if (page && page.workspace_id === workspaceId) {
      console.log('📥 Page change detected for current workspace, refreshing pages...');
      setTimeout(() => {
        pagesHook.fetchPages();
      }, 50);
    }
  }, [workspaceId, pagesHook]);

  // Use the centralized realtime manager instead of direct subscription
  if (workspaceId) {
    subscribe('workspace', workspaceId, {
      onPageChange: handlePageChange,
    });
  }

  return pagesHook;
}
