
import { useBlockOperations } from '@/hooks/blocks/useBlockOperations';
import { useOptimisticBlocks } from '@/hooks/useOptimisticBlocks';
import { useCallback } from 'react';
import { BlockUpdateParams } from '@/hooks/blocks/types';
import { useToast } from '@/hooks/use-toast';

export function useEnhancedBlocks(pageId?: string, workspaceId?: string) {
  const { 
    blocks, 
    loading, 
    error, 
    createBlock, 
    updateBlock, 
    deleteBlock, 
    refetch: fetchBlocks,
    connectionStatus 
  } = useBlockOperations(workspaceId, pageId);
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

    // Create optimistic block immediately
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
      // Create the actual block (database will generate real UUID)
      const { data, error } = await createBlock({ 
        type: type as any, 
        content, 
        parent_id: parentBlockId || pageId 
      });
      
      if (error) {
        console.error('Enhanced: Block creation failed, clearing optimistic', error);
        clearOptimisticCreation(tempId);
        return { data: null, error };
      }

      console.log('Enhanced: Block created successfully, will clear optimistic after delay', data);
      
      // Clear optimistic update after a longer delay to ensure realtime has time to catch up
      // This prevents the "flash" effect where the block temporarily disappears
      setTimeout(() => {
        console.log('Enhanced: Clearing optimistic creation for', tempId);
        clearOptimisticCreation(tempId);
      }, 2000); // Increased delay to 2 seconds
      
      return { data, error: null };
    } catch (err) {
      console.error('Enhanced: Unexpected error in block creation', err);
      clearOptimisticCreation(tempId);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create block';
      
      if (errorMessage.includes('invalid input syntax for type uuid')) {
        console.error('Enhanced: UUID validation error detected - temporary ID may have been sent to database');
        toast({
          title: "Error",
          description: "Block creation failed due to invalid ID format. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred while creating the block.",
          variant: "destructive",
        });
      }
      
      return { data: null, error: errorMessage };
    }
  }, [pageId, workspaceId, createBlock, optimisticCreateBlock, clearOptimisticCreation, toast]);

  const enhancedUpdateBlock = useCallback(async (id: string, updates: BlockUpdateParams) => {
    // Validate that we're not trying to update with a temporary ID
    if (id.startsWith('temp-')) {
      console.warn('Enhanced: Attempted to update block with temporary ID, ignoring', id);
      return { data: null, error: 'Cannot update temporary block' };
    }

    // Apply optimistic update immediately
    optimisticUpdateBlock(id, updates);

    try {
      const { data, error } = await updateBlock(id, updates);
      
      if (error) {
        clearOptimisticUpdate(id);
        return { data: null, error };
      }

      // Clear optimistic update after a longer delay to allow realtime sync
      setTimeout(() => {
        clearOptimisticUpdate(id);
      }, 1000); // Increased delay
      
      return { data, error: null };
    } catch (err) {
      clearOptimisticUpdate(id);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update block';
      console.error('Unexpected error in enhancedUpdateBlock:', err);
      
      if (errorMessage.includes('invalid input syntax for type uuid')) {
        console.error('Enhanced: UUID validation error during update - temporary ID may have been used');
        toast({
          title: "Error",
          description: "Block update failed due to invalid ID format. Please refresh the page.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred while updating the block.",
          variant: "destructive",
        });
      }
      
      return { data: null, error: errorMessage };
    }
  }, [updateBlock, optimisticUpdateBlock, clearOptimisticUpdate, toast]);

  const enhancedDeleteBlock = useCallback(async (id: string) => {
    // Validate that we're not trying to delete with a temporary ID
    if (id.startsWith('temp-')) {
      console.warn('Enhanced: Attempted to delete block with temporary ID, ignoring', id);
      return { error: 'Cannot delete temporary block' };
    }

    // Apply optimistic delete immediately
    optimisticDeleteBlock(id);

    try {
      const { error } = await deleteBlock(id);
      
      if (error) {
        revertAllOptimisticChanges();
        return { error };
      }

      return { error: null };
    } catch (err) {
      revertAllOptimisticChanges();
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete block';
      console.error('Unexpected error in enhancedDeleteBlock:', err);
      
      if (errorMessage.includes('invalid input syntax for type uuid')) {
        console.error('Enhanced: UUID validation error during delete - temporary ID may have been used');
        toast({
          title: "Error",
          description: "Block deletion failed due to invalid ID format. Please refresh the page.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred while deleting the block.",
          variant: "destructive",
        });
      }
      
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
    connectionStatus,
  };
}
