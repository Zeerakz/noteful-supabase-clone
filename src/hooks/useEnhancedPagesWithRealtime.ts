
import { useCallback } from 'react';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';

export function useEnhancedPagesWithRealtime(workspaceId?: string) {
  const pagesHook = useEnhancedPages(workspaceId);
  const { subscribe } = useRealtimeManager();

  const handlePageChange = useCallback((payload: any) => {
    console.log('📄 Page change detected, refreshing pages...');
    // Small delay to ensure the database write is complete
    setTimeout(() => {
      pagesHook.fetchPages();
    }, 50);
  }, [pagesHook]);

  // Use the centralized realtime manager
  if (workspaceId) {
    subscribe('workspace', workspaceId, {
      onPageChange: handlePageChange,
    });
  }

  return pagesHook;
}
