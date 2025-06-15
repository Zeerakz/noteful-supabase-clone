
import { useCallback } from 'react';
import { Block } from '@/types/block';
import { useToast } from '@/hooks/use-toast';

interface UseEnhancedDeletePageProps {
  deletePage: (id: string) => Promise<{ error: string | null }>;
  optimisticPages: Block[];
  optimisticDeletePage: (pageId: string) => void;
  revertAllOptimisticChanges: () => void;
}

export function useEnhancedDeletePage({
  deletePage,
  optimisticPages,
  optimisticDeletePage,
  revertAllOptimisticChanges,
}: UseEnhancedDeletePageProps) {
  const { toast } = useToast();

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

  return enhancedDeletePage;
}
