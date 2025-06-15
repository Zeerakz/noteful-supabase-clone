
import { usePages } from '@/hooks/usePages';
import { useOptimisticPages } from '@/hooks/useOptimisticPages';
import { useEnhancedPageMutations } from '@/hooks/useEnhancedPageMutations';

export function useEnhancedPages(workspaceId?: string) {
  const pageData = usePages(workspaceId);
  const optimisticData = useOptimisticPages({ pages: pageData.pages });

  const mutations = useEnhancedPageMutations({
    workspaceId,
    createPage: pageData.createPage,
    updatePage: pageData.updatePage,
    deletePage: pageData.deletePage,
    updatePageHierarchy: pageData.updatePageHierarchy,
    ...optimisticData,
  });

  return {
    pages: optimisticData.optimisticPages,
    loading: pageData.loading,
    error: pageData.error,
    createPage: mutations.createPage,
    updatePage: mutations.updatePage,
    deletePage: mutations.deletePage,
    updatePageHierarchy: mutations.updatePageHierarchy,
    fetchPages: pageData.fetchPages,
    hasOptimisticChanges: optimisticData.hasOptimisticChanges,
    revertAllOptimisticChanges: optimisticData.revertAllOptimisticChanges,
  };
}
