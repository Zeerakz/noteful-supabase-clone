
import { useCallback } from 'react';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useWorkspaceRealtime } from '@/hooks/useWorkspaceRealtime';

export function useEnhancedPagesWithRealtime(workspaceId?: string) {
  const pagesHook = useEnhancedPages(workspaceId);

  const handlePageChange = useCallback((payload: any) => {
    console.log('📄 Page change detected, refreshing pages...');
    // Add a small delay to ensure the database write is complete
    setTimeout(() => {
      pagesHook.fetchPages();
    }, 100);
  }, [pagesHook.fetchPages]);

  useWorkspaceRealtime({
    workspaceId,
    onPageChange: handlePageChange,
  });

  return pagesHook;
}
