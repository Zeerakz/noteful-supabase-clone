
import { useBlockOperations } from '@/hooks/blocks/useBlockOperations';
import { useOptimisticBlocks } from '@/hooks/useOptimisticBlocks';
import { useCallback } from 'react';
import { Block, BlockUpdateParams } from '@/hooks/blocks/types';
import { useToast } from '@/hooks/use-toast';

export function useEnhancedBlocks(pageId?: string) {
  const { blocks, loading, error, createBlock, updateBlock, deleteBlock, fetchBlocks } = useBlockOperations(pageId);
  const { toast } = useToast();

  const {
    optimisticBlocks,
    optimisticCreateBlock,
    optimisticUpdateBlock,
    optimisticDeleteBlock,
    clearOptimisticUpdate,
    clearOptimisticCreation,
    revertAllOptimisticChanges,
    hasOptimisticChanges,
  } = useOptimisticBlocks({ blocks });

  const enhancedCreateBlock = useCallback(async (type: string, content: any = {}, parentBlockId?: string) => {
    if (!pageId) return { error: 'Page not selected', data: null };

    // Optimistic update
    const tempId = optimisticCreateBlock({
      page_id: pageId,
      type,
      content,
      parent_block_id: parentBlockId,
      pos: Date.now(),
    });

    try {
      const { data, error } = await createBlock(type, content, parentBlockId);
      
      if (error) {
        // Revert optimistic update on error
        clearOptimisticCreation(tempId);
        throw new Error(error);
      }

      // Clear optimistic update on success
      clearOptimisticCreation(tempId);
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create block';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: errorMessage };
    }
  }, [pageId, createBlock, optimisticCreateBlock, clearOptimisticCreation, toast]);

  const enhancedUpdateBlock = useCallback(async (id: string, updates: BlockUpdateParams) => {
    // Optimistic update
    optimisticUpdateBlock(id, updates);

    try {
      const { data, error } = await updateBlock(id, updates);
      
      if (error) {
        // Revert optimistic update on error
        clearOptimisticUpdate(id);
        throw new Error(error);
      }

      // Clear optimistic update on success
      clearOptimisticUpdate(id);
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update block';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: errorMessage };
    }
  }, [updateBlock, optimisticUpdateBlock, clearOptimisticUpdate, toast]);

  const enhancedDeleteBlock = useCallback(async (id: string) => {
    // Optimistic update
    optimisticDeleteBlock(id);

    try {
      const { error } = await deleteBlock(id);
      
      if (error) {
        // Revert optimistic update on error
        revertAllOptimisticChanges();
        throw new Error(error);
      }

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete block';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: errorMessage };
    }
  }, [deleteBlock, optimisticDeleteBlock, revertAllOptimisticChanges, toast]);

  return {
    blocks: optimisticBlocks,
    loading,
    error,
    createBlock: enhancedCreateBlock,
    updateBlock: enhancedUpdateBlock,
    deleteBlock: enhancedDeleteBlock,
    fetchBlocks,
    hasOptimisticChanges,
    revertAllOptimisticChanges,
  };
}
