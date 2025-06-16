
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useStableSubscription } from '@/hooks/useStableSubscription';
import { Block, BlockType, BlockUpdateParams } from './types';

export function useBlockOperations(workspaceId?: string, pageId?: string) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const mountedRef = useRef(true);

  const fetchBlocks = useCallback(async () => {
    if (!pageId || !workspaceId) {
      setBlocks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('parent_id', pageId)
        .order('pos', { ascending: true });

      if (error) throw error;

      if (mountedRef.current) {
        setBlocks(data || []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch blocks');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [pageId, workspaceId]);

  // Handle realtime updates
  const handleRealtimeUpdate = useCallback((payload: any) => {
    if (!mountedRef.current) return;

    const { eventType, new: newRecord, old: oldRecord } = payload;

    setBlocks(prev => {
      switch (eventType) {
        case 'INSERT':
          const newBlock = newRecord as Block;
          if (prev.some(block => block.id === newBlock.id)) {
            return prev;
          }
          return [...prev, newBlock].sort((a, b) => (a.pos || 0) - (b.pos || 0));

        case 'UPDATE':
          const updatedBlock = newRecord as Block;
          return prev.map(block => 
            block.id === updatedBlock.id ? updatedBlock : block
          ).sort((a, b) => (a.pos || 0) - (b.pos || 0));

        case 'DELETE':
          const deletedBlock = oldRecord as Block;
          return prev.filter(block => block.id !== deletedBlock.id);

        default:
          return prev;
      }
    });
  }, []);

  // Set up realtime subscription
  const subscriptionConfig = pageId ? {
    table: 'blocks',
    filter: `parent_id=eq.${pageId}`,
  } : null;

  useStableSubscription(subscriptionConfig, handleRealtimeUpdate, [pageId]);

  const createBlock = useCallback(async (params: {
    type: BlockType;
    content?: any;
    parent_id?: string;
    pos?: number;
  }) => {
    if (!user || !workspaceId || !pageId) {
      return { data: null, error: 'Missing required parameters' };
    }

    try {
      const { data, error } = await supabase
        .from('blocks')
        .insert({
          workspace_id: workspaceId,
          type: params.type,
          parent_id: params.parent_id || pageId,
          content: params.content || {},
          pos: params.pos ?? Date.now(),
          created_by: user.id,
          last_edited_by: user.id,
          properties: {},
        })
        .select()
        .single();

      return { data, error: error?.message || null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create block' };
    }
  }, [user, workspaceId, pageId]);

  const updateBlock = useCallback(async (id: string, updates: BlockUpdateParams) => {
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    try {
      const { data, error } = await supabase
        .from('blocks')
        .update({
          ...updates,
          last_edited_by: user.id,
          last_edited_time: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      return { data, error: error?.message || null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update block' };
    }
  }, [user]);

  const deleteBlock = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', id);

      return { error: error?.message || null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete block' };
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchBlocks();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchBlocks]);

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
