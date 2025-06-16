
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
    if (!workspaceId || !pageId) return { error: 'Page or workspace not selected', data: null };

    // Map extended types to valid database types
    const validType = mapTypeForDatabase(type);

    // Optimistic update with properly mapped type
    const tempId = optimisticCreateBlock({
      workspace_id: workspaceId,
      type: validType,
      content,
      parent_id: parentBlockId || pageId,
      pos: Date.now() % 1000000, // Keep position as number
      properties: {},
    });

    try {
      const { data, error } = await createBlock({ 
        type: validType as any, 
        content, 
        parent_id: parentBlockId || pageId 
      });
      
      if (error) {
        clearOptimisticCreation(tempId);
        throw new Error(error);
      }

      // Clear optimistic creation after successful creation
      setTimeout(() => clearOptimisticCreation(tempId), 100);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create block';
      clearOptimisticCreation(tempId);
      toast({
        title: "Error",
        description: errorMessage,
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
        throw new Error(error);
      }

      clearOptimisticUpdate(id);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update block';
      clearOptimisticUpdate(id);
      toast({
        title: "Error",
        description: errorMessage,
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
        throw new Error(error);
      }

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete block';
      revertAllOptimisticChanges();
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

// Helper function to map UI types to valid database types
function mapTypeForDatabase(type: string): string {
  const typeMapping: Record<string, string> = {
    'two_column': 'text',
    'table': 'text',
    'embed': 'text', 
    'file_attachment': 'text'
  };
  
  return typeMapping[type] || type;
}
