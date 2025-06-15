
import { useCallback } from 'react';
import { Block } from '@/types/block';
import { useToast } from '@/hooks/use-toast';
import { canNestPage } from '@/utils/navigationConstraints';

interface UseEnhancedUpdatePageHierarchyProps {
  updatePageHierarchy: (pageId: string, newParentId: string | null, newIndex: number) => Promise<{ error: string | null }>;
  optimisticPages: Block[];
  optimisticUpdatePage: (pageId: string, updates: Partial<Block>) => void;
  clearOptimisticUpdate: (pageId: string) => void;
}

export function useEnhancedUpdatePageHierarchy({
  updatePageHierarchy,
  optimisticPages,
  optimisticUpdatePage,
  clearOptimisticUpdate,
}: UseEnhancedUpdatePageHierarchyProps) {
  const { toast } = useToast();

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
  
  return enhancedUpdatePageHierarchy;
}
