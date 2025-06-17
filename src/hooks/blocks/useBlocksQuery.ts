
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Block, BlockType } from '@/types/block';
import { blocksQueryKeys, BlocksQueryFilters } from './queryKeys';
import { blocksQueryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

// Fetch blocks function
const fetchBlocks = async (
  workspaceId: string,
  pageId: string,
  filters: BlocksQueryFilters = {}
): Promise<Block[]> => {
  if (!workspaceId || !pageId) {
    throw new Error('Workspace ID and Page ID are required');
  }

  let query = supabase
    .from('blocks')
    .select('*')
    .eq('parent_id', pageId)
    .eq('workspace_id', workspaceId)
    .is('in_trash', false)
    .order('pos', { ascending: true });

  // Apply filters
  if (filters.type) {
    // Only filter by valid block types that exist in the database
    const validBlockTypes: BlockType[] = [
      'page', 'database', 'text', 'image', 'heading_1', 'heading_2', 'heading_3',
      'todo_item', 'bulleted_list_item', 'numbered_list_item', 'toggle_list',
      'code', 'quote', 'divider', 'callout'
    ];
    
    // Type guard to ensure we only pass valid BlockType values
    if (validBlockTypes.includes(filters.type as BlockType)) {
      query = query.eq('type', filters.type as BlockType);
    }
  }

  if (filters.search) {
    query = query.ilike('content->text', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch blocks: ${error.message}`);
  }

  return (data as Block[]) || [];
};

// Custom hook for querying blocks with React Query
export function useBlocksQuery(
  workspaceId?: string,
  pageId?: string,
  filters: BlocksQueryFilters = {},
  options: {
    enabled?: boolean;
    refetchInterval?: number;
  } = {}
) {
  const { enabled = true, refetchInterval } = options;

  return useQuery({
    queryKey: blocksQueryKeys.filtered(workspaceId || '', pageId || '', filters),
    queryFn: () => fetchBlocks(workspaceId!, pageId!, filters),
    enabled: enabled && !!workspaceId && !!pageId,
    refetchInterval,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  }, blocksQueryClient);
}

// Hook for invalidating blocks queries
export function useInvalidateBlocks() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({
      queryKey: blocksQueryKeys.all,
    }),
    
    invalidateWorkspace: (workspaceId: string) =>
      queryClient.invalidateQueries({
        queryKey: blocksQueryKeys.workspace(workspaceId),
      }),
    
    invalidatePage: (workspaceId: string, pageId: string) =>
      queryClient.invalidateQueries({
        queryKey: blocksQueryKeys.page(workspaceId, pageId),
      }),
  };
}

// Mutation hook for creating blocks with optimistic updates
export function useCreateBlockMutation(workspaceId: string, pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockData: Partial<Omit<Block, 'type'>> & { type: BlockType }) => {
      const { data, error } = await supabase
        .from('blocks')
        .insert({
          ...blockData,
          workspace_id: workspaceId,
          parent_id: pageId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Block;
    },
    onMutate: async (newBlock) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: blocksQueryKeys.page(workspaceId, pageId) 
      });

      // Snapshot the previous value
      const previousBlocks = queryClient.getQueryData<Block[]>(
        blocksQueryKeys.page(workspaceId, pageId)
      );

      // Create optimistic block with temporary ID
      const optimisticBlock: Block = {
        id: crypto.randomUUID(),
        workspace_id: workspaceId,
        teamspace_id: null,
        type: newBlock.type,
        parent_id: pageId,
        properties: newBlock.properties || {},
        content: newBlock.content || {},
        pos: newBlock.pos ?? Date.now() % 1000000,
        created_time: new Date().toISOString(),
        last_edited_time: new Date().toISOString(),
        created_by: newBlock.created_by || null,
        last_edited_by: newBlock.last_edited_by || null,
        archived: false,
        in_trash: false,
        ...newBlock,
      };

      // Optimistically update the cache
      queryClient.setQueryData<Block[]>(
        blocksQueryKeys.page(workspaceId, pageId),
        (old) => old ? [...old, optimisticBlock] : [optimisticBlock]
      );

      // Return context object with the snapshot value
      return { previousBlocks, optimisticBlock };
    },
    onError: (err, newBlock, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        blocksQueryKeys.page(workspaceId, pageId),
        context?.previousBlocks
      );

      toast({
        title: "Failed to create block",
        description: "There was an error creating the block. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Block created",
        description: "Block has been created successfully.",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: blocksQueryKeys.page(workspaceId, pageId),
      });
    },
  }, blocksQueryClient);
}

// Mutation hook for updating blocks with optimistic updates
export function useUpdateBlockMutation(workspaceId: string, pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Block, 'type'>> & { type?: BlockType } }) => {
      const { data, error } = await supabase
        .from('blocks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Block;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: blocksQueryKeys.page(workspaceId, pageId) 
      });

      // Snapshot the previous value
      const previousBlocks = queryClient.getQueryData<Block[]>(
        blocksQueryKeys.page(workspaceId, pageId)
      );

      // Optimistically update the cache
      queryClient.setQueryData<Block[]>(
        blocksQueryKeys.page(workspaceId, pageId),
        (old) => {
          if (!old) return old;
          return old.map((block) =>
            block.id === id
              ? { ...block, ...updates, last_edited_time: new Date().toISOString() }
              : block
          );
        }
      );

      // Return context object with the snapshot value
      return { previousBlocks };
    },
    onError: (err, { id, updates }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        blocksQueryKeys.page(workspaceId, pageId),
        context?.previousBlocks
      );

      toast({
        title: "Failed to update block",
        description: "There was an error updating the block. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Block updated",
        description: "Block has been updated successfully.",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: blocksQueryKeys.page(workspaceId, pageId),
      });
    },
  }, blocksQueryClient);
}

// Mutation hook for deleting blocks with optimistic updates
export function useDeleteBlockMutation(workspaceId: string, pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;
      return blockId;
    },
    onMutate: async (blockId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: blocksQueryKeys.page(workspaceId, pageId) 
      });

      // Snapshot the previous value
      const previousBlocks = queryClient.getQueryData<Block[]>(
        blocksQueryKeys.page(workspaceId, pageId)
      );

      // Optimistically update the cache
      queryClient.setQueryData<Block[]>(
        blocksQueryKeys.page(workspaceId, pageId),
        (old) => old ? old.filter((block) => block.id !== blockId) : old
      );

      // Return context object with the snapshot value and deleted block
      const deletedBlock = previousBlocks?.find(block => block.id === blockId);
      return { previousBlocks, deletedBlock };
    },
    onError: (err, blockId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        blocksQueryKeys.page(workspaceId, pageId),
        context?.previousBlocks
      );

      toast({
        title: "Failed to delete block",
        description: "There was an error deleting the block. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Block deleted",
        description: "Block has been deleted successfully.",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: blocksQueryKeys.page(workspaceId, pageId),
      });
    },
  }, blocksQueryClient);
}
