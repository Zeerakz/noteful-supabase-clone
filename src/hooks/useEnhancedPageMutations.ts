
import { useCallback } from 'react';
import { Block } from '@/types/block';
import { useToast } from '@/hooks/use-toast';
import { canNestPage } from '@/utils/navigationConstraints';

interface UseEnhancedPageMutationsProps {
  workspaceId?: string;
  createPage: (title: string, parentId?: string) => Promise<{ data: Block | null; error: string | null }>;
  updatePage: (id: string, updates: Partial<Block>) => Promise<{ data: Block | null; error: string | null }>;
  deletePage: (id: string) => Promise<{ error: string | null }>;
  updatePageHierarchy: (pageId: string, newParentId: string | null, newIndex: number) => Promise<{ error: string | null }>;
  optimisticPages: Block[];
  optimisticCreatePage: (pageData: Partial<Block>) => string;
  optimisticUpdatePage: (pageId: string, updates: Partial<Block>) => void;
  optimisticDeletePage: (pageId: string) => void;
  clearOptimisticUpdate: (pageId: string) => void;
  clearOptimisticCreation: (tempId: string) => void;
  clearOptimisticCreationByMatch: (realPage: Block) => void;
  revertAllOptimisticChanges: () => void;
}

export function useEnhancedPageMutations({
  workspaceId,
  createPage,
  updatePage,
  deletePage,
  updatePageHierarchy,
  optimisticPages,
  optimisticCreatePage,
  optimisticUpdatePage,
  optimisticDeletePage,
  clearOptimisticUpdate,
  clearOptimisticCreation,
  clearOptimisticCreationByMatch,
  revertAllOptimisticChanges,
}: UseEnhancedPageMutationsProps) {
  const { toast } = useToast();

  const enhancedCreatePage = useCallback(async (title: string, parentPageId?: string) => {
    if (!workspaceId) return { error: 'Workspace not selected' };

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

    const tempId = optimisticCreatePage({
      properties: { title },
      parent_id: parentPageId,
      workspace_id: workspaceId,
      type: 'page',
    });

    console.log('Created optimistic page with tempId:', tempId);

    try {
      const { data, error } = await createPage(title, parentPageId);
      
      if (error) {
        console.error('Server page creation failed:', error);
        clearOptimisticCreation(tempId);
        throw new Error(error);
      }

      console.log('Server page creation successful:', data);

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

  const enhancedUpdatePage = useCallback(async (id: string, updates: Partial<Pick<Block, 'properties' | 'parent_id' | 'pos'>>) => {
    console.log('Updating page optimistically:', { id, updates });

    if (updates.parent_id !== undefined) {
      const validation = canNestPage(optimisticPages, id, updates.parent_id);
      if (!validation.canNest) {
        toast({
          title: "Cannot move page",
          description: validation.reason,
          variant: "destructive",
        });
        return { data: null, error: validation.reason };
      }
    }

    const blockUpdates: Partial<Block> = { ...updates };

    optimisticUpdatePage(id, blockUpdates);

    try {
      const { data, error } = await updatePage(id, blockUpdates);
      
      if (error) {
        console.error('Server page update failed:', error);
        clearOptimisticUpdate(id);
        throw error;
      }

      console.log('Server page update successful:', data);

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

    console.log('Deleting page optimistically:', { id, title: pageToDelete.properties?.title });

    optimisticDeletePage(id);

    try {
      const { error } = await deletePage(id);
      
      if (error) {
        console.error('Server page deletion failed:', error);
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
    const currentPage = optimisticPages.find(p => p.id === pageId);
    if (!currentPage) return { error: 'Page not found' };

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

    optimisticUpdatePage(pageId, {
      parent_id: newParentId,
      pos: newIndex,
    });

    try {
      const { error } = await updatePageHierarchy(pageId, newParentId, newIndex);
      
      if (error) {
        console.error('Server page hierarchy update failed:', error);
        clearOptimisticUpdate(pageId);
        throw new Error(error);
      }

      console.log('Server page hierarchy update successful');

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
    createPage: enhancedCreatePage,
    updatePage: enhancedUpdatePage,
    deletePage: enhancedDeletePage,
    updatePageHierarchy: enhancedUpdatePageHierarchy,
  };
}
