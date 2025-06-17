
import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { indexedDBPersister } from '@/lib/indexedDBPersister';
import { Block, BlockType } from '@/types/block';
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
        const { data: newBlock, error: createError } = await supabase
          .from('blocks')
          .insert(variables)
          .select()
          .single();
        
        if (createError) throw createError;
        
        // Update cache
        queryClient.setQueryData<Block[]>(
          blocksQueryKeys.page(workspaceId, pageId),
          (old) => old ? [...old, newBlock] : [newBlock]
        );
        break;

      case 'updateBlock':
        const { data: updatedBlock, error: updateError } = await supabase
          .from('blocks')
          .update(variables.updates)
          .eq('id', variables.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        
        // Update cache
        queryClient.setQueryData<Block[]>(
          blocksQueryKeys.page(workspaceId, pageId),
          (old) => old ? old.map(block => 
            block.id === variables.id ? updatedBlock : block
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
    mutationFn: async (blockData: Partial<Omit<Block, 'type'>> & { type: BlockType }) => {
      if (isOnline) {
        // Execute immediately if online
        const { data, error } = await supabase
          .from('blocks')
          .insert(blockData)
          .select()
          .single();

        if (error) throw error;
        return data as Block;
      } else {
        // Store for later if offline
        const mutationId = await storePendingMutation('createBlock', blockData);
        
        // Create optimistic block
        const optimisticBlock: Block = {
          id: mutationId || crypto.randomUUID(),
          workspace_id: workspaceId,
          teamspace_id: null,
          type: blockData.type,
          parent_id: pageId,
          properties: blockData.properties || {},
          content: blockData.content || {},
          pos: blockData.pos ?? Date.now() % 1000000,
          created_time: new Date().toISOString(),
          last_edited_time: new Date().toISOString(),
          created_by: user?.id || null,
          last_edited_by: user?.id || null,
          archived: false,
          in_trash: false,
          ...blockData,
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
        const { data, error } = await supabase
          .from('blocks')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data as Block;
      } else {
        await storePendingMutation('updateBlock', { id, updates });
        
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
