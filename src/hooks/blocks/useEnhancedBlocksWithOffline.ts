
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBlocksQuery, useInvalidateBlocks } from './useBlocksQuery';
import { useBlockCacheSync } from './useBlockCacheSync';
import { useOfflineMutations } from './useOfflineMutations';
import { BlocksQueryFilters } from './queryKeys';
import { Block, BlockType, ExtendedBlockType } from '@/types/block';

interface UseEnhancedBlocksWithOfflineOptions {
  filters?: BlocksQueryFilters;
  enabled?: boolean;
  refetchInterval?: number;
  enableRealtimeSync?: boolean;
}

export function useEnhancedBlocksWithOffline(
  workspaceId?: string,
  pageId?: string,
  options: UseEnhancedBlocksWithOfflineOptions = {}
) {
  const { user } = useAuth();
  const { 
    filters = {}, 
    enabled = true, 
    refetchInterval,
    enableRealtimeSync = true 
  } = options;

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

  // Set up cache synchronization with realtime updates
  const { 
    isConnected: isRealtimeConnected, 
    error: realtimeError, 
    retry: retryRealtime 
  } = useBlockCacheSync({
    workspaceId,
    pageId,
    enabled: enableRealtimeSync && enabled && !!user,
  });

  // Offline mutations with persistence
  const {
    isOnline,
    pendingMutations,
    createBlockOffline,
    updateBlockOffline,
    deleteBlockOffline,
    processPendingMutations,
    clearPendingMutations,
  } = useOfflineMutations(workspaceId || '', pageId || '');

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

  // Helper functions with offline support
  const createBlock = useCallback(async (params: {
    type: BlockType;
    content?: any;
    parent_id?: string;
    pos?: number;
  }) => {
    if (!user || !workspaceId || !pageId) {
      throw new Error('Missing required parameters');
    }

    const blockData = {
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
    };

    return createBlockOffline.mutateAsync(blockData);
  }, [user, workspaceId, pageId, createBlockOffline]);

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

    return updateBlockOffline.mutateAsync({
      id,
      updates: validUpdates,
    });
  }, [user, updateBlockOffline]);

  const deleteBlock = useCallback(async (id: string) => {
    return deleteBlockOffline.mutateAsync(id);
  }, [deleteBlockOffline]);

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
    
    // Connection states
    isOnline,
    isRealtimeConnected,
    realtimeError,
    retryRealtime,
    
    // Offline state
    pendingMutations,
    
    // Actions
    createBlock,
    updateBlock,
    deleteBlock,
    refreshBlocks,
    processPendingMutations,
    clearPendingMutations,
    
    // Cache invalidation
    invalidateAll,
    invalidateWorkspace: () => workspaceId && invalidateWorkspace(workspaceId),
    invalidatePage: () => workspaceId && pageId && invalidatePage(workspaceId, pageId),
    
    // Mutation states
    isCreating: createBlockOffline.isPending,
    isUpdating: updateBlockOffline.isPending,
    isDeleting: deleteBlockOffline.isPending,
    
    // Raw query for advanced usage
    queryResult: { blocks, isLoading, error, refetch, isRefetching },
  };
}
