
import { usePages } from '@/hooks/usePages';
import { useOptimisticPages } from '@/hooks/useOptimisticPages';
import { useCallback } from 'react';
import { Page } from '@/types/page';
import { useToast } from '@/hooks/use-toast';
import { canNestPage } from '@/utils/navigationConstraints';

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

    // Validate nesting depth before creating
    if (parentPageId) {
      const validation = canNestPage(optimisticPages, 'new-page', parentPageId);
      if (!validation.canNest) {
        toast({
          title: "Cannot create page",
          description: validation.reason,
          variant: "destructive",
        });
        return { error: validation.reason };
      }
    }

    console.log('Creating page optimistically:', { title, parentPageId, workspaceId });

    // Optimistic update
    const tempId = optimisticCreatePage({
      title,
      parent_page_id: parentPageId,
      workspace_id: workspaceId,
    });

    console.log('Created optimistic page with tempId:', tempId);

    try {
      const { data, error } = await createPage(title, parentPageId);
      
      if (error) {
        console.error('Server page creation failed:', error);
        // Revert optimistic update on error
        clearOptimisticCreation(tempId);
        throw new Error(error);
      }

      console.log('Server page creation successful:', data);

      // Clear optimistic update on success using the real page data
      if (data) {
        clearOptimisticCreationByMatch(data);
        console.log('Cleared optimistic page by match');
      } else {
        clearOptimisticCreation(tempId);
        console.log('Cleared optimistic page by tempId');
      }
      
      toast({
        title: "Success",
        description: "Page created successfully",
      });

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create page';
      console.error('Page creation error:', err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: errorMessage };
    }
  }, [workspaceId, createPage, optimisticCreatePage, clearOptimisticCreation, clearOptimisticCreationByMatch, toast, optimisticPages]);

  const enhancedUpdatePage = useCallback(async (id: string, updates: Partial<Pick<Page, 'title' | 'parent_page_id' | 'order_index'>>) => {
    console.log('Updating page optimistically:', { id, updates });

    // Validate nesting depth if parent is being changed
    if (updates.parent_page_id !== undefined) {
      const validation = canNestPage(optimisticPages, id, updates.parent_page_id);
      if (!validation.canNest) {
        toast({
          title: "Cannot move page",
          description: validation.reason,
          variant: "destructive",
        });
        return { data: null, error: validation.reason };
      }
    }

    // Optimistic update
    optimisticUpdatePage(id, updates);

    try {
      const { data, error } = await updatePage(id, updates);
      
      if (error) {
        console.error('Server page update failed:', error);
        // Revert optimistic update on error
        clearOptimisticUpdate(id);
        throw new Error(error);
      }

      console.log('Server page update successful:', data);

      // Clear optimistic update on success
      clearOptimisticUpdate(id);
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update page';
      console.error('Page update error:', err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: errorMessage };
    }
  }, [updatePage, optimisticUpdatePage, clearOptimisticUpdate, toast, optimisticPages]);

  const enhancedDeletePage = useCallback(async (id: string) => {
    const pageToDelete = optimisticPages.find(p => p.id === id);
    if (!pageToDelete) return { error: 'Page not found' };

    console.log('Deleting page optimistically:', { id, title: pageToDelete.title });

    // Optimistic update
    optimisticDeletePage(id);

    try {
      const { error } = await deletePage(id);
      
      if (error) {
        console.error('Server page deletion failed:', error);
        // Revert optimistic update on error
        revertAllOptimisticChanges();
        throw new Error(error);
      }

      console.log('Server page deletion successful');

      toast({
        title: "Success",
        description: "Page deleted successfully",
      });

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete page';
      console.error('Page deletion error:', err);
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

    // Validate nesting depth constraints
    const validation = canNestPage(optimisticPages, pageId, newParentId);
    if (!validation.canNest) {
      toast({
        title: "Cannot move page",
        description: validation.reason,
        variant: "destructive",
      });
      return { error: validation.reason };
    }

    console.log('Updating page hierarchy optimistically:', { pageId, newParentId, newIndex });

    // Optimistic update
    optimisticUpdatePage(pageId, {
      parent_page_id: newParentId,
      order_index: newIndex,
    });

    try {
      const { error } = await updatePageHierarchy(pageId, newParentId, newIndex);
      
      if (error) {
        console.error('Server page hierarchy update failed:', error);
        // Revert optimistic update on error
        clearOptimisticUpdate(pageId);
        throw new Error(error);
      }

      console.log('Server page hierarchy update successful');

      // Clear optimistic update on success
      clearOptimisticUpdate(pageId);
      
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update page hierarchy';
      console.error('Page hierarchy update error:', err);
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
