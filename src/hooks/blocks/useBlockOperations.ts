
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';
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
  const { subscribe } = useRealtimeManager();
  const mountedRef = useRef(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

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
        console.log('📦 Fetched blocks:', normalizedBlocks);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch blocks');
        console.error('❌ Error fetching blocks:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [pageId, workspaceId]);

  // Handle realtime updates using the centralized manager
  const handleRealtimeUpdate = useCallback((payload: any) => {
    if (!mountedRef.current) return;

    const { eventType, new: newRecord, old: oldRecord } = payload;
    console.log('🔄 Realtime block update:', { eventType, newRecord, oldRecord });

    setBlocks(prev => {
      switch (eventType) {
        case 'INSERT':
          const newBlock = normalizeBlock(newRecord);
          if (prev.some(block => block.id === newBlock.id)) {
            return prev;
          }
          const insertedBlocks = [...prev, newBlock].sort((a, b) => (a.pos || 0) - (b.pos || 0));
          console.log('➕ Block inserted:', newBlock);
          return insertedBlocks;

        case 'UPDATE':
          const updatedBlock = normalizeBlock(newRecord);
          const updatedBlocks = prev.map(block => 
            block.id === updatedBlock.id ? updatedBlock : block
          ).sort((a, b) => (a.pos || 0) - (b.pos || 0));
          console.log('✏️ Block updated:', updatedBlock);
          return updatedBlocks;

        case 'DELETE':
          const deletedBlock = oldRecord;
          const filteredBlocks = prev.filter(block => block.id !== deletedBlock.id);
          console.log('🗑️ Block deleted:', deletedBlock);
          return filteredBlocks;

        default:
          return prev;
      }
    });
  }, []);

  // Set up realtime subscription using the centralized manager
  useEffect(() => {
    if (pageId && user) {
      console.log('🔌 Setting up realtime subscription for page:', pageId);
      const unsubscribe = subscribe('page', pageId, {
        onBlockChange: handleRealtimeUpdate,
      });
      unsubscribeRef.current = unsubscribe;

      return () => {
        console.log('🔌 Cleaning up realtime subscription for page:', pageId);
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    }
  }, [pageId, user, subscribe, handleRealtimeUpdate]);

  // Helper function to get the next position for a block
  const getNextBlockPosition = async (parentId: string) => {
    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('pos')
        .eq('parent_id', parentId)
        .order('pos', { ascending: false })
        .limit(1);

      if (error) throw error;

      const maxPos = data && data.length > 0 ? data[0].pos : -1;
      return maxPos + 1;
    } catch (err) {
      console.error('Error getting next block position:', err);
      return Date.now() % 1000000;
    }
  };

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
      const parentId = params.parent_id || pageId;
      const nextPos = params.pos !== undefined ? params.pos : await getNextBlockPosition(parentId);

      const { data, error } = await supabase
        .from('blocks')
        .insert({
          workspace_id: workspaceId,
          type: params.type,
          parent_id: parentId,
          content: params.content || {},
          pos: nextPos,
          created_by: user.id,
          last_edited_by: user.id,
          properties: {},
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Block created:', data);
      return { data: normalizeBlock(data), error: null };
    } catch (err) {
      console.error('❌ Error creating block:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create block' };
    }
  }, [user, workspaceId, pageId, getNextBlockPosition]);

  const updateBlock = useCallback(async (id: string, updates: BlockUpdateParams) => {
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    try {
      const supabaseUpdates: any = {
        ...updates,
        last_edited_by: user.id,
        last_edited_time: new Date().toISOString(),
      };

      if (updates.properties) {
        supabaseUpdates.properties = updates.properties;
      }

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

      console.log('✅ Block updated:', data);
      return { data: normalizeBlock(data), error: null };
    } catch (err) {
      console.error('❌ Error updating block:', err);
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

      console.log('✅ Block deleted:', id);
      return { error: null };
    } catch (err) {
      console.error('❌ Error deleting block:', err);
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
