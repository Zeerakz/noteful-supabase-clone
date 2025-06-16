
import { usePages } from '@/hooks/usePages';

export function useEnhancedPages(workspaceId?: string) {
  const pageData = usePages(workspaceId);

  return {
    pages: pageData.pages,
    loading: pageData.loading,
    error: pageData.error,
    createPage: pageData.createPage,
    updatePage: pageData.updatePage,
    deletePage: pageData.deletePage,
    updatePageHierarchy: pageData.updatePageHierarchy,
    fetchPages: pageData.fetchPages,
    hasOptimisticChanges: false,
    revertAllOptimisticChanges: () => {},
  };
}
