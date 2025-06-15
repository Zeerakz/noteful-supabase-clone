import { useCallback } from 'react';
import { Block } from '@/types/block';
import { useGentleErrorHandler } from '@/hooks/useGentleErrorHandler';

interface UseEnhancedDeletePageProps {
  deletePage: (id: string) => Promise<{ error: string | null }>;
  optimisticPages: Block[];
  optimisticDeletePage: (pageId: string) => void;
  clearOptimisticDeletion: (pageId: string) => void;
  revertAllOptimisticChanges: () => void;
}

export function useEnhancedDeletePage({
  deletePage,
  optimisticPages,
  optimisticDeletePage,
  clearOptimisticDeletion,
  revertAllOptimisticChanges,
}: UseEnhancedDeletePageProps) {
  const { handleSuccess, handleSaveError } = useGentleErrorHandler();

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
        handleSaveError('Failed to delete page', error);
        return { error };
      }

      console.log('Server page deletion successful');
      clearOptimisticDeletion(id);

      handleSuccess("Page deleted successfully");

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete page';
      console.error('Page deletion error:', err);
      revertAllOptimisticChanges();
      handleSaveError(errorMessage);
      return { error: errorMessage };
    }
  }, [optimisticPages, deletePage, optimisticDeletePage, clearOptimisticDeletion, revertAllOptimisticChanges, handleSuccess, handleSaveError]);

  return enhancedDeletePage;
}
