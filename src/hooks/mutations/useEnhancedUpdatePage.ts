
import { useCallback } from 'react';
import { Block } from '@/types/block';
import { useToast } from '@/hooks/use-toast';
import { canNestPage } from '@/utils/navigationConstraints';

interface UseEnhancedUpdatePageProps {
  updatePage: (id: string, updates: Partial<Block>) => Promise<{ data: Block | null; error: string | null }>;
  optimisticPages: Block[];
  optimisticUpdatePage: (pageId: string, updates: Partial<Block>) => void;
  clearOptimisticUpdate: (pageId: string) => void;
  revertAllOptimisticChanges: () => void;
}

export function useEnhancedUpdatePage({
  updatePage,
  optimisticPages,
  optimisticUpdatePage,
  clearOptimisticUpdate,
  revertAllOptimisticChanges,
}: UseEnhancedUpdatePageProps) {
  const { toast } = useToast();

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
        throw new Error(error);
      }

      console.log('Server page update successful:', data);

      clearOptimisticUpdate(id);
      
      return { data, error: null };
    } catch (err) {
      revertAllOptimisticChanges();
      const errorMessage = err instanceof Error ? err.message : 'Failed to update page';
      console.error('Page update error:', err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: errorMessage };
    }
  }, [updatePage, optimisticUpdatePage, clearOptimisticUpdate, revertAllOptimisticChanges, toast, optimisticPages]);

  return enhancedUpdatePage;
}
