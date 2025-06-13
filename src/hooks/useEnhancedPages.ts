
import { usePages } from '@/hooks/usePages';
import { useOptimisticPages } from '@/hooks/useOptimisticPages';
import { useCallback } from 'react';
import { Page } from '@/types/page';
import { useToast } from '@/hooks/use-toast';

export function useEnhancedPages(workspaceId?: string) {
  const { pages, loading, error, createPage, updatePage, deletePage, updatePageHierarchy, fetchPages } = usePages(workspaceId);
  const { toast } = useToast();

  const {
    optimisticPages,
    optimisticCreatePage,
    optimisticUpdatePage,
    optimisticDeletePage,
    clearOptimisticUpdate,
    clearOptimisticCreation,
    clearOptimisticCreationByMatch,
    revertAllOptimisticChanges,
    hasOptimisticChanges,
  } = useOptimisticPages({ pages });

  const enhancedCreatePage = useCallback(async (title: string, parentPageId?: string) => {
    if (!workspaceId) return { error: 'Workspace not selected' };

    // Optimistic update
    const tempId = optimisticCreatePage({
      title,
      parent_page_id: parentPageId,
      workspace_id: workspaceId,
    });

    try {
      const { data, error } = await createPage(title, parentPageId);
      
      if (error) {
        // Revert optimistic update on error
        clearOptimisticCreation(tempId);
        throw new Error(error);
      }

      // Clear optimistic update on success using the real page data
      if (data) {
        clearOptimisticCreationByMatch(data);
      } else {
        clearOptimisticCreation(tempId);
      }
      
      toast({
        title: "Success",
        description: "Page created successfully",
      });

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create page';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: errorMessage };
    }
  }, [workspaceId, createPage, optimisticCreatePage, clearOptimisticCreation, clearOptimisticCreationByMatch, toast]);

  const enhancedUpdatePage = useCallback(async (id: string, updates: Partial<Pick<Page, 'title' | 'parent_page_id' | 'order_index'>>) => {
    // Optimistic update
    optimisticUpdatePage(id, updates);

    try {
      const { data, error } = await updatePage(id, updates);
      
      if (error) {
        // Revert optimistic update on error
        clearOptimisticUpdate(id);
        throw new Error(error);
      }

      // Clear optimistic update on success
      clearOptimisticUpdate(id);
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update page';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: errorMessage };
    }
  }, [updatePage, optimisticUpdatePage, clearOptimisticUpdate, toast]);

  const enhancedDeletePage = useCallback(async (id: string) => {
    const pageToDelete = optimisticPages.find(p => p.id === id);
    if (!pageToDelete) return { error: 'Page not found' };

    // Optimistic update
    optimisticDeletePage(id);

    try {
      const { error } = await deletePage(id);
      
      if (error) {
        // Revert optimistic update on error
        revertAllOptimisticChanges();
        throw new Error(error);
      }

      toast({
        title: "Success",
        description: "Page deleted successfully",
      });

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete page';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: errorMessage };
    }
  }, [optimisticPages, deletePage, optimisticDeletePage, revertAllOptimisticChanges, toast]);

  const enhancedUpdatePageHierarchy = useCallback(async (pageId: string, newParentId: string | null, newIndex: number) => {
    // Find current page for optimistic update
    const currentPage = optimisticPages.find(p => p.id === pageId);
    if (!currentPage) return { error: 'Page not found' };

    // Optimistic update
    optimisticUpdatePage(pageId, {
      parent_page_id: newParentId,
      order_index: newIndex,
    });

    try {
      const { error } = await updatePageHierarchy(pageId, newParentId, newIndex);
      
      if (error) {
        // Revert optimistic update on error
        clearOptimisticUpdate(pageId);
        throw new Error(error);
      }

      // Clear optimistic update on success
      clearOptimisticUpdate(pageId);
      
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update page hierarchy';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: errorMessage };
    }
  }, [optimisticPages, updatePageHierarchy, optimisticUpdatePage, clearOptimisticUpdate, toast]);

  return {
    pages: optimisticPages,
    loading,
    error,
    createPage: enhancedCreatePage,
    updatePage: enhancedUpdatePage,
    deletePage: enhancedDeletePage,
    updatePageHierarchy: enhancedUpdatePageHierarchy,
    fetchPages,
    hasOptimisticChanges,
    revertAllOptimisticChanges,
  };
}
