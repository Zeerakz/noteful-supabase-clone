
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBlocksQuery, useCreateBlockMutation, useUpdateBlockMutation, useDeleteBlockMutation, useInvalidateBlocks } from './useBlocksQuery';
import { BlocksQueryFilters } from './queryKeys';
import { Block, BlockType, ExtendedBlockType } from '@/types/block';

interface UseBlocksWithQueryOptions {
  filters?: BlocksQueryFilters;
  enabled?: boolean;
  refetchInterval?: number;
}

export function useBlocksWithQuery(
  workspaceId?: string,
  pageId?: string,
  options: UseBlocksWithQueryOptions = {}
) {
  const { user } = useAuth();
  const { filters = {}, enabled = true, refetchInterval } = options;

  // Query for blocks data
  const {
    data: blocks = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useBlocksQuery(workspaceId, pageId, filters, {
    enabled: enabled && !!user,
    refetchInterval,
  });

  // Mutations with optimistic updates
  const createBlockMutation = useCreateBlockMutation(workspaceId || '', pageId || '');
  const updateBlockMutation = useUpdateBlockMutation(workspaceId || '', pageId || '');
  const deleteBlockMutation = useDeleteBlockMutation(workspaceId || '', pageId || '');

  // Invalidation helpers
  const { invalidateAll, invalidateWorkspace, invalidatePage } = useInvalidateBlocks();

  // Helper function to convert ExtendedBlockType to BlockType
  const toValidBlockType = (type: ExtendedBlockType): BlockType | null => {
    const validBlockTypes: BlockType[] = [
      'page', 'database', 'text', 'image', 'heading_1', 'heading_2', 'heading_3',
      'todo_item', 'bulleted_list_item', 'numbered_list_item', 'toggle_list',
      'code', 'quote', 'divider', 'callout'
    ];
    
    return validBlockTypes.includes(type as BlockType) ? (type as BlockType) : null;
  };

  // Helper functions
  const createBlock = useCallback(async (params: {
    type: BlockType;
    content?: any;
    parent_id?: string;
    pos?: number;
  }) => {
    if (!user || !workspaceId || !pageId) {
      throw new Error('Missing required parameters');
    }

    return createBlockMutation.mutateAsync({
      ...params,
      workspace_id: workspaceId,
      parent_id: params.parent_id || pageId,
      created_by: user.id,
      last_edited_by: user.id,
      properties: {},
      content: params.content || {},
      pos: params.pos ?? Date.now() % 1000000,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
      archived: false,
      in_trash: false,
      teamspace_id: null,
    });
  }, [user, workspaceId, pageId, createBlockMutation]);

  const updateBlock = useCallback(async (id: string, updates: Partial<Block>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create a copy of updates without the type field first
    const { type: updateType, ...otherUpdates } = updates;
    
    // Create the valid updates object
    const validUpdates: Partial<Omit<Block, 'type'>> & { type?: BlockType } = {
      ...otherUpdates,
      last_edited_by: user.id,
      last_edited_time: new Date().toISOString(),
    };

    // Handle type conversion from ExtendedBlockType to BlockType if provided
    if (updateType) {
      const validType = toValidBlockType(updateType);
      if (validType) {
        validUpdates.type = validType;
      }
      // If invalid type, we simply don't include it (don't throw error)
    }

    return updateBlockMutation.mutateAsync({
      id,
      updates: validUpdates,
    });
  }, [user, updateBlockMutation]);

  const deleteBlock = useCallback(async (id: string) => {
    return deleteBlockMutation.mutateAsync(id);
  }, [deleteBlockMutation]);

  const refreshBlocks = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    // Data
    blocks,
    
    // Loading states
    loading: isLoading,
    isRefetching,
    
    // Error state
    error: error?.message || null,
    
    // Actions
    createBlock,
    updateBlock,
    deleteBlock,
    refreshBlocks,
    
    // Cache invalidation
    invalidateAll,
    invalidateWorkspace: () => workspaceId && invalidateWorkspace(workspaceId),
    invalidatePage: () => workspaceId && pageId && invalidatePage(workspaceId, pageId),
    
    // Mutation states
    isCreating: createBlockMutation.isPending,
    isUpdating: updateBlockMutation.isPending,
    isDeleting: deleteBlockMutation.isPending,
    
    // Raw query for advanced usage
    queryResult: { blocks, isLoading, error, refetch, isRefetching },
  };
}
