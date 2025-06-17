import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { indexedDBPersister } from '@/lib/indexedDBPersister';
import { Block, BlockType, ExtendedBlockType } from '@/types/block';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { blocksQueryKeys } from './queryKeys';

interface PendingMutation {
  id: string;
  mutation: {
    mutationFn: string;
    variables: any;
    timestamp: number;
    retryCount: number;
  };
}

export function useOfflineMutations(workspaceId: string, pageId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingMutations, setPendingMutations] = useState<PendingMutation[]>([]);

  // Helper function to convert ExtendedBlockType to BlockType
  const toValidBlockType = useCallback((type: ExtendedBlockType): BlockType | null => {
    const validBlockTypes: BlockType[] = [
      'page', 'database', 'text', 'image', 'heading_1', 'heading_2', 'heading_3',
      'todo_item', 'bulleted_list_item', 'numbered_list_item', 'toggle_list',
      'code', 'quote', 'divider', 'callout'
    ];
    
    return validBlockTypes.includes(type as BlockType) ? (type as BlockType) : null;
  }, []);

  // Helper function to check if a type can be stored in database
  const canStoreInDatabase = useCallback((type: ExtendedBlockType): boolean => {
    return toValidBlockType(type) !== null;
  }, [toValidBlockType]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Back online - processing pending mutations');
      processPendingMutations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📴 Gone offline - mutations will be queued');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending mutations on mount
  useEffect(() => {
    loadPendingMutations();
  }, []);

  const loadPendingMutations = async () => {
    try {
      const mutations = await indexedDBPersister.getPendingMutations();
      setPendingMutations(mutations);
      
      if (mutations.length > 0) {
        console.log(`📤 Found ${mutations.length} pending mutations`);
        if (isOnline) {
          processPendingMutations();
        }
      }
    } catch (error) {
      console.error('Failed to load pending mutations:', error);
    }
  };

  const storePendingMutation = async (mutationFn: string, variables: any) => {
    if (!user) return;

    const mutation: PendingMutation = {
      id: crypto.randomUUID(),
      mutation: {
        mutationFn,
        variables,
        timestamp: Date.now(),
        retryCount: 0,
      },
    };

    await indexedDBPersister.storePendingMutation(mutation);
    setPendingMutations(prev => [...prev, mutation]);

    return mutation.id;
  };

  const processPendingMutations = async () => {
    if (!isOnline || !user) return;

    const mutations = await indexedDBPersister.getPendingMutations();
    
    for (const mutation of mutations) {
      try {
        await executeMutation(mutation);
        await indexedDBPersister.removePendingMutation(mutation.id);
        setPendingMutations(prev => prev.filter(m => m.id !== mutation.id));
        
        toast({
          title: "Sync complete",
          description: "Offline changes have been synchronized.",
        });
      } catch (error) {
        console.error('Failed to execute pending mutation:', error);
        
        // Increment retry count
        mutation.mutation.retryCount++;
        
        if (mutation.mutation.retryCount >= 3) {
          // Remove after 3 failed attempts
          await indexedDBPersister.removePendingMutation(mutation.id);
          setPendingMutations(prev => prev.filter(m => m.id !== mutation.id));
          
          toast({
            title: "Sync failed",
            description: "Some offline changes could not be synchronized.",
            variant: "destructive",
          });
        } else {
          // Update retry count in storage
          await indexedDBPersister.storePendingMutation(mutation);
        }
      }
    }
  };

  const executeMutation = async (pendingMutation: PendingMutation) => {
    const { mutationFn, variables } = pendingMutation.mutation;

    switch (mutationFn) {
      case 'createBlock':
        // Variables should already have valid BlockType from storage
        const createData = {
          ...variables,
          properties: variables.properties || {},
          content: variables.content || {},
        };

        const { data: newBlock, error: createError } = await supabase
          .from('blocks')
          .insert(createData)
          .select()
          .single();
        
        if (createError) throw createError;
        
        // Convert database response to Block type
        const blockFromDb: Block = {
          ...newBlock,
          type: newBlock.type as ExtendedBlockType, // Safe cast back to ExtendedBlockType for UI
          properties: (newBlock.properties as any) || {},
          content: (newBlock.content as any) || {},
        };
        
        // Update cache
        queryClient.setQueryData<Block[]>(
          blocksQueryKeys.page(workspaceId, pageId),
          (old) => old ? [...old, blockFromDb] : [blockFromDb]
        );
        break;

      case 'updateBlock':
        // Variables should already have valid types from storage
        const updateData = variables.updates;

        const { data: updatedBlock, error: updateError } = await supabase
          .from('blocks')
          .update(updateData)
          .eq('id', variables.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        
        // Convert database response to Block type
        const updatedBlockFromDb: Block = {
          ...updatedBlock,
          type: updatedBlock.type as ExtendedBlockType, // Safe cast back to ExtendedBlockType for UI
          properties: (updatedBlock.properties as any) || {},
          content: (updatedBlock.content as any) || {},
        };
        
        // Update cache
        queryClient.setQueryData<Block[]>(
          blocksQueryKeys.page(workspaceId, pageId),
          (old) => old ? old.map(block => 
            block.id === variables.id ? updatedBlockFromDb : block
          ) : []
        );
        break;

      case 'deleteBlock':
        const { error: deleteError } = await supabase
          .from('blocks')
          .delete()
          .eq('id', variables.id);
        
        if (deleteError) throw deleteError;
        
        // Update cache
        queryClient.setQueryData<Block[]>(
          blocksQueryKeys.page(workspaceId, pageId),
          (old) => old ? old.filter(block => block.id !== variables.id) : []
        );
        break;

      default:
        throw new Error(`Unknown mutation function: ${mutationFn}`);
    }
  };

  // Offline-aware mutations
  const createBlockOffline = useMutation({
    mutationFn: async (blockData: Partial<Block> & { type: ExtendedBlockType; workspace_id: string }) => {
      // Check if this type can be stored in database
      if (!canStoreInDatabase(blockData.type)) {
        throw new Error(`Block type '${blockData.type}' is UI-only and cannot be stored in database. Use a valid BlockType instead.`);
      }

      // Convert ExtendedBlockType to BlockType for database operations
      const validType = toValidBlockType(blockData.type);
      if (!validType) {
        throw new Error(`Block type '${blockData.type}' cannot be stored in database`);
      }

      if (isOnline) {
        // Execute immediately if online
        const dbData = {
          workspace_id: blockData.workspace_id,
          teamspace_id: blockData.teamspace_id || null,
          type: validType, // Use converted type for database
          parent_id: blockData.parent_id || pageId,
          properties: blockData.properties || {},
          content: blockData.content || {},
          pos: blockData.pos ?? Date.now() % 1000000,
          created_by: user?.id || null,
          last_edited_by: user?.id || null,
          archived: blockData.archived || false,
          in_trash: blockData.in_trash || false,
        };

        const { data, error } = await supabase
          .from('blocks')
          .insert(dbData)
          .select()
          .single();

        if (error) throw error;
        
        return {
          ...data,
          type: validType as ExtendedBlockType, // Cast back to ExtendedBlockType for UI consistency
          properties: (data.properties as any) || {},
          content: (data.content as any) || {},
        } as Block;
      } else {
        // Store for later if offline (convert type for storage)
        const storageData = {
          ...blockData,
          type: validType, // Store only valid BlockType for offline processing
        };
        const mutationId = await storePendingMutation('createBlock', storageData);
        
        // Create optimistic block with valid type
        const optimisticBlock: Block = {
          id: mutationId || crypto.randomUUID(),
          workspace_id: blockData.workspace_id,
          teamspace_id: null,
          type: validType as ExtendedBlockType, // Use valid type for optimistic update
          parent_id: blockData.parent_id || pageId,
          properties: blockData.properties || {},
          content: blockData.content || {},
          pos: blockData.pos ?? Date.now() % 1000000,
          created_time: new Date().toISOString(),
          last_edited_time: new Date().toISOString(),
          created_by: user?.id || null,
          last_edited_by: user?.id || null,
          archived: false,
          in_trash: false,
        };

        return optimisticBlock;
      }
    },
    onSuccess: (data) => {
      // Update cache optimistically
      queryClient.setQueryData<Block[]>(
        blocksQueryKeys.page(workspaceId, pageId),
        (old) => old ? [...old, data] : [data]
      );
    },
  });

  const updateBlockOffline = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Block> }) => {
      if (isOnline) {
        // Handle type conversion for database
        const dbUpdates = { ...updates };
        if (dbUpdates.type) {
          const validType = toValidBlockType(dbUpdates.type);
          if (validType) {
            dbUpdates.type = validType;
          } else {
            // Remove invalid type from update
            delete dbUpdates.type;
          }
        }

        const { data, error } = await supabase
          .from('blocks')
          .update(dbUpdates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        
        return {
          ...data,
          type: (updates.type || data.type) as ExtendedBlockType, // Preserve original type if provided
          properties: (data.properties as any) || {},
          content: (data.content as any) || {},
        } as Block;
      } else {
        // Store offline update with type conversion
        const storageUpdates = { ...updates };
        if (storageUpdates.type) {
          const validType = toValidBlockType(storageUpdates.type);
          if (validType) {
            storageUpdates.type = validType;
          } else {
            delete storageUpdates.type;
          }
        }
        
        await storePendingMutation('updateBlock', { id, updates: storageUpdates });
        
        // Return optimistic update
        const currentBlocks = queryClient.getQueryData<Block[]>(
          blocksQueryKeys.page(workspaceId, pageId)
        );
        const currentBlock = currentBlocks?.find(block => block.id === id);
        
        return currentBlock ? { ...currentBlock, ...updates } : null;
      }
    },
    onSuccess: (data, { id }) => {
      if (data) {
        queryClient.setQueryData<Block[]>(
          blocksQueryKeys.page(workspaceId, pageId),
          (old) => old ? old.map(block => block.id === id ? data : block) : []
        );
      }
    },
  });

  const deleteBlockOffline = useMutation({
    mutationFn: async (blockId: string) => {
      if (isOnline) {
        const { error } = await supabase
          .from('blocks')
          .delete()
          .eq('id', blockId);

        if (error) throw error;
        return blockId;
      } else {
        await storePendingMutation('deleteBlock', { id: blockId });
        return blockId;
      }
    },
    onSuccess: (blockId) => {
      queryClient.setQueryData<Block[]>(
        blocksQueryKeys.page(workspaceId, pageId),
        (old) => old ? old.filter(block => block.id !== blockId) : []
      );
    },
  });

  return {
    isOnline,
    pendingMutations: pendingMutations.length,
    createBlockOffline,
    updateBlockOffline,
    deleteBlockOffline,
    processPendingMutations: useCallback(processPendingMutations, [isOnline, user]),
    clearPendingMutations: useCallback(async () => {
      await indexedDBPersister.clearPendingMutations();
      setPendingMutations([]);
    }, []),
  };
}
