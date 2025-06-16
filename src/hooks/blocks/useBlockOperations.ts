import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useStableSubscription } from '@/hooks/useStableSubscription';
import { Block, BlockType, BlockUpdateParams } from './types';

// Helper function to convert Supabase data to our Block type
const normalizeBlock = (data: any): Block => ({
  ...data,
  properties: data.properties && typeof data.properties === 'object' ? data.properties : {},
  content: data.content && typeof data.content === 'object' ? data.content : null,
});

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
        const normalizedBlocks = (data || []).map(normalizeBlock);
        setBlocks(normalizedBlocks);
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
          const newBlock = normalizeBlock(newRecord);
          if (prev.some(block => block.id === newBlock.id)) {
            return prev;
          }
          return [...prev, newBlock].sort((a, b) => (a.pos || 0) - (b.pos || 0));

        case 'UPDATE':
          const updatedBlock = normalizeBlock(newRecord);
          return prev.map(block => 
            block.id === updatedBlock.id ? updatedBlock : block
          ).sort((a, b) => (a.pos || 0) - (b.pos || 0));

        case 'DELETE':
          const deletedBlock = oldRecord;
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

      if (error) throw error;

      return { data: normalizeBlock(data), error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create block' };
    }
  }, [user, workspaceId, pageId]);

  const updateBlock = useCallback(async (id: string, updates: BlockUpdateParams) => {
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    try {
      // Convert our updates to match Supabase schema
      const supabaseUpdates: any = {
        ...updates,
        last_edited_by: user.id,
        last_edited_time: new Date().toISOString(),
      };

      // Ensure properties is JSON-compatible
      if (updates.properties) {
        supabaseUpdates.properties = updates.properties;
      }

      // Ensure content is JSON-compatible
      if (updates.content !== undefined) {
        supabaseUpdates.content = updates.content;
      }

      const { data, error } = await supabase
        .from('blocks')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data: normalizeBlock(data), error: null };
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

      if (error) throw error;

      return { error: null };
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
