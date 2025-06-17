
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Block } from '@/types/block';
import { blocksQueryKeys, BlocksQueryFilters } from './queryKeys';
import { blocksQueryClient } from '@/lib/queryClient';

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
    query = query.eq('type', filters.type);
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

// Mutation hook for creating blocks
export function useCreateBlockMutation(workspaceId: string, pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockData: Partial<Block>) => {
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
    onSuccess: () => {
      // Invalidate blocks queries for this page
      queryClient.invalidateQueries({
        queryKey: blocksQueryKeys.page(workspaceId, pageId),
      });
    },
  }, blocksQueryClient);
}

// Mutation hook for updating blocks
export function useUpdateBlockMutation(workspaceId: string, pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Block> }) => {
      const { data, error } = await supabase
        .from('blocks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Block;
    },
    onSuccess: () => {
      // Invalidate blocks queries for this page
      queryClient.invalidateQueries({
        queryKey: blocksQueryKeys.page(workspaceId, pageId),
      });
    },
  }, blocksQueryClient);
}

// Mutation hook for deleting blocks
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
    onSuccess: () => {
      // Invalidate blocks queries for this page
      queryClient.invalidateQueries({
        queryKey: blocksQueryKeys.page(workspaceId, pageId),
      });
    },
  }, blocksQueryClient);
}
