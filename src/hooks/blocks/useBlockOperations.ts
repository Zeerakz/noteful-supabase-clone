import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Block, BlockCreateParams, BlockUpdateParams, BlockOperationResult } from './types';

export function useBlockOperations(workspaceId?: string, parentId?: string | null) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBlocks = useCallback(async () => {
    if (!user || !workspaceId) {
      setBlocks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('blocks')
        .select('id, workspace_id, type, parent_id, properties, content, pos, created_time, last_edited_time, created_by, last_edited_by, archived, in_trash')
        .eq('workspace_id', workspaceId)
        .eq('archived', false);

      if (parentId === undefined) {
        setBlocks([]);
        setLoading(false);
        return;
      } else if (parentId === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', parentId);
      }

      // The .order('pos') clause causes a type error, likely due to stale Supabase types.
      // Sorting client-side as a temporary workaround.
      const { data, error } = await query;

      if (error) throw error;
      
      const sortedData = ((data as Block[]) || []).sort((a, b) => (a.pos || 0) - (b.pos || 0));
      setBlocks(sortedData);

      setError(null);
    } catch (err) {
      console.error('Error fetching blocks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch blocks');
    } finally {
      setLoading(false);
    }
  }, [user, workspaceId, parentId]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const createBlock = async (params: BlockCreateParams): Promise<BlockOperationResult<Block>> => {
    if (!user || !workspaceId) return { error: 'User not authenticated or workspace not selected', data: null };

    const optimisticId = `temp-${Date.now()}`;
    try {
      const newBlockData: Omit<Block, 'id'> = {
        workspace_id: workspaceId,
        parent_id: parentId === undefined ? null : parentId,
        type: params.type || 'text',
        properties: params.properties || {},
        content: params.content || null,
        pos: params.pos ?? blocks.length,
        created_time: new Date().toISOString(),
        last_edited_time: new Date().toISOString(),
        created_by: user.id,
        last_edited_by: user.id,
        archived: false,
        in_trash: false,
        ...params,
      };

      const optimisticBlock = { ...newBlockData, id: optimisticId };
      setBlocks(prev => [...prev, optimisticBlock].sort((a, b) => (a.pos || 0) - (b.pos || 0)));

      const { data, error } = await supabase
        .from('blocks')
        .insert({
          workspace_id: newBlockData.workspace_id,
          parent_id: newBlockData.parent_id,
          type: newBlockData.type as any, // Cast to any to bypass stale enum type
          properties: newBlockData.properties,
          content: newBlockData.content,
          created_by: user.id,
          last_edited_by: user.id,
          pos: newBlockData.pos,
        })
        .select()
        .single();

      if (error) throw error;

      setBlocks(prev => prev.map(block => (block.id === optimisticId ? (data as Block) : block)).sort((a, b) => (a.pos || 0) - (b.pos || 0)));
      return { data: data as Block, error: null };
    } catch (err) {
      setBlocks(prev => prev.filter(block => block.id !== optimisticId));
      const errorMsg = err instanceof Error ? err.message : 'Failed to create block';
      setError(errorMsg);
      return { data: null, error: errorMsg };
    }
  };

  const updateBlock = async (id: string, updates: BlockUpdateParams): Promise<BlockOperationResult<Block>> => {
    if (!user) return { error: 'User not authenticated', data: null };
    
    try {
      setBlocks(prev =>
        prev.map(block =>
          block.id === id ? { ...block, ...updates, last_edited_time: new Date().toISOString() } : block
        ).sort((a, b) => (a.pos || 0) - (b.pos || 0))
      );

      const { data, error } = await supabase
        .from('blocks')
        .update({ ...(updates as any), last_edited_by: user.id })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBlocks(prev => prev.map(block => (block.id === id ? (data as Block) : block)).sort((a, b) => (a.pos || 0) - (b.pos || 0)));
      return { data: data as Block, error: null };
    } catch (err) {
      await fetchBlocks(); // Refetch to get correct state
      const errorMsg = err instanceof Error ? err.message : 'Failed to update block';
      setError(errorMsg);
      return { data: null, error: errorMsg };
    }
  };

  const deleteBlock = async (id: string): Promise<BlockOperationResult<void>> => {
    try {
      const originalBlocks = [...blocks];
      setBlocks(prev => prev.filter(block => block.id !== id));

      const { error } = await supabase.from('blocks').delete().eq('id', id);

      if (error) throw error;

      return { data: undefined, error: null };
    } catch (err) {
      setBlocks(blocks);
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete block';
      setError(errorMsg);
      return { data: null, error: errorMsg };
    }
  };

  return {
    blocks,
    setBlocks,
    loading,
    error,
    refetch: fetchBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
  };
}
