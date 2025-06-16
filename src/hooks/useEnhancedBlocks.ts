
import { useBlockOperations } from '@/hooks/blocks/useBlockOperations';
import { useOptimisticBlocks } from '@/hooks/useOptimisticBlocks';
import { useCallback } from 'react';
import { BlockUpdateParams } from '@/hooks/blocks/types';
import { useToast } from '@/hooks/use-toast';

export function useEnhancedBlocks(pageId?: string, workspaceId?: string) {
  const { blocks, loading, error, createBlock, updateBlock, deleteBlock, refetch: fetchBlocks } = useBlockOperations(workspaceId, pageId);
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
    if (!workspaceId || !pageId) {
      const errorMessage = 'Page or workspace not selected';
      toast({
        title: "Error",
        description: "Cannot create block. Please select a workspace and page.",
        variant: "destructive",
      });
      return { error: errorMessage, data: null };
    }

    console.log('Enhanced: Starting block creation with optimistic update', { type, parentBlockId: parentBlockId || pageId });

    // Optimistic update - create immediately in UI
    const tempId = optimisticCreateBlock({
      workspace_id: workspaceId,
      type: type as any,
      content,
      parent_id: parentBlockId || pageId,
      pos: Date.now(),
      properties: {},
    });

    console.log('Enhanced: Optimistic block created with tempId', tempId);

    try {
      const { data, error } = await createBlock({ 
        type: type as any, 
        content, 
        parent_id: parentBlockId || pageId 
      });
      
      if (error) {
        console.error('Enhanced: Block creation failed, clearing optimistic', error);
        clearOptimisticCreation(tempId);
        // Error is already handled in useBlockOperations with toast
        return { data: null, error };
      }

      console.log('Enhanced: Block created successfully, clearing optimistic', data);
      clearOptimisticCreation(tempId);
      return { data, error: null };
    } catch (err) {
      console.error('Enhanced: Unexpected error in block creation', err);
      clearOptimisticCreation(tempId);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create block';
      
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the block.",
        variant: "destructive",
      });
      
      return { data: null, error: errorMessage };
    }
  }, [pageId, workspaceId, createBlock, optimisticCreateBlock, clearOptimisticCreation, toast]);

  const enhancedUpdateBlock = useCallback(async (id: string, updates: BlockUpdateParams) => {
    optimisticUpdateBlock(id, updates);

    try {
      const { data, error } = await updateBlock(id, updates);
      
      if (error) {
        clearOptimisticUpdate(id);
        // Error is already handled in useBlockOperations with toast
        return { data: null, error };
      }

      clearOptimisticUpdate(id);
      return { data, error: null };
    } catch (err) {
      clearOptimisticUpdate(id);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update block';
      console.error('Unexpected error in enhancedUpdateBlock:', err);
      
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the block.",
        variant: "destructive",
      });
      
      return { data: null, error: errorMessage };
    }
  }, [updateBlock, optimisticUpdateBlock, clearOptimisticUpdate, toast]);

  const enhancedDeleteBlock = useCallback(async (id: string) => {
    optimisticDeleteBlock(id);

    try {
      const { error } = await deleteBlock(id);
      
      if (error) {
        revertAllOptimisticChanges();
        // Error is already handled in useBlockOperations with toast
        return { error };
      }

      return { error: null };
    } catch (err) {
      revertAllOptimisticChanges();
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete block';
      console.error('Unexpected error in enhancedDeleteBlock:', err);
      
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the block.",
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
