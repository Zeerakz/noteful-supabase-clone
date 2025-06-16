
import { useCallback } from 'react';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useWorkspaceRealtime } from '@/hooks/useWorkspaceRealtime';

export function useEnhancedPagesWithRealtime(workspaceId?: string) {
  const pagesHook = useEnhancedPages(workspaceId);

  const handlePageChange = useCallback((payload: any) => {
    console.log('📄 Page change detected, refreshing pages...');
    // Small delay to ensure the database write is complete
    setTimeout(() => {
      pagesHook.fetchPages();
    }, 50);
  }, [pagesHook]);

  useWorkspaceRealtime({
    workspaceId,
    onPageChange: handlePageChange,
  });

  return pagesHook;
}
