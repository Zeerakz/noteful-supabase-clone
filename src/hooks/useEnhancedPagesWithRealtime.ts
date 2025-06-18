
import { useCallback, useRef } from 'react';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';

export function useEnhancedPagesWithRealtime(workspaceId?: string) {
  const pagesHook = useEnhancedPages(workspaceId);
  const { subscribeToPage } = useRealtimeManager();
  const lastRefreshTime = useRef<number>(0);

  const handlePageChange = useCallback((payload: any) => {
    const { new: newPage, old: oldPage } = payload;
    const page = newPage || oldPage;
    
    // Only refresh if this change affects our workspace
    if (page && page.workspace_id === workspaceId) {
      const now = Date.now();
      // Throttle refreshes to prevent excessive calls (minimum 500ms between refreshes)
      if (now - lastRefreshTime.current > 500) {
        console.log('📥 Page change detected for current workspace, refreshing pages...');
        lastRefreshTime.current = now;
        
        setTimeout(() => {
          pagesHook.fetchPages();
        }, 50);
      }
    }
  }, [workspaceId, pagesHook]);

  // Use the centralized realtime manager for workspace-level page changes
  if (workspaceId) {
    // Subscribe to a workspace-wide page channel (we'll use the workspace ID as the page ID for this)
    subscribeToPage(workspaceId, handlePageChange);
  }

  return pagesHook;
}
