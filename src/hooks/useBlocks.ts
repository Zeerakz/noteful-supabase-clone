
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Block {
  id: string;
  page_id: string;
  parent_block_id?: string;
  type: string;
  content: any;
  pos: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useBlocks(pageId?: string) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  const fetchBlocks = async () => {
    if (!user || !pageId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('page_id', pageId)
        .order('pos', { ascending: true });

      if (error) throw error;
      setBlocks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blocks');
    } finally {
      setLoading(false);
    }
  };

  const createBlock = async (type: string, content: any = {}, parentBlockId?: string) => {
    if (!user || !pageId) return { error: 'User not authenticated or page not selected' };

    // Generate optimistic ID
    const optimisticId = `temp-${Date.now()}`;
    
    try {
      // Get the next position for this parent
      const { data: existingBlocks } = await supabase
        .from('blocks')
        .select('pos')
        .eq('page_id', pageId)
        .eq('parent_block_id', parentBlockId || null)
        .order('pos', { ascending: false })
        .limit(1);

      const nextPos = existingBlocks && existingBlocks.length > 0 
        ? existingBlocks[0].pos + 1 
        : 0;

      const newBlock: Block = {
        id: optimisticId,
        page_id: pageId,
        parent_block_id: parentBlockId || null,
        type,
        content,
        pos: nextPos,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistic update
      setBlocks(prev => [...prev, newBlock].sort((a, b) => a.pos - b.pos));

      const { data, error } = await supabase
        .from('blocks')
        .insert([
          {
            page_id: pageId,
            parent_block_id: parentBlockId || null,
            type,
            content,
            pos: nextPos,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      // Replace optimistic block with real data
      setBlocks(prev => prev.map(block => 
        block.id === optimisticId ? data : block
      ));
      
      return { data, error: null };
    } catch (err) {
      // Remove optimistic block on error
      setBlocks(prev => prev.filter(block => block.id !== optimisticId));
      const error = err instanceof Error ? err.message : 'Failed to create block';
      return { data: null, error };
    }
  };

  const updateBlock = async (id: string, updates: Partial<Pick<Block, 'type' | 'content' | 'pos' | 'parent_block_id'>>) => {
    try {
      // Optimistic update
      setBlocks(prev => prev.map(block => 
        block.id === id 
          ? { ...block, ...updates, updated_at: new Date().toISOString() }
          : block
      ));

      const { data, error } = await supabase
        .from('blocks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update with server response
      setBlocks(prev => prev.map(block => 
        block.id === id ? data : block
      ));
      
      return { data, error: null };
    } catch (err) {
      // Revert optimistic update on error
      await fetchBlocks();
      const error = err instanceof Error ? err.message : 'Failed to update block';
      return { data: null, error };
    }
  };

  const deleteBlock = async (id: string) => {
    try {
      // Optimistic update
      const originalBlocks = blocks;
      setBlocks(prev => prev.filter(block => block.id !== id));

      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return { error: null };
    } catch (err) {
      // Revert optimistic update on error
      setBlocks(blocks);
      const error = err instanceof Error ? err.message : 'Failed to delete block';
      return { error };
    }
  };

  useEffect(() => {
    if (!pageId || !user) return;

    fetchBlocks();

    // Set up realtime subscription
    const channel = supabase
      .channel(`blocks-${pageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocks',
          filter: `page_id=eq.${pageId}`
        },
        (payload) => {
          console.log('Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newBlock = payload.new as Block;
            setBlocks(prev => {
              // Don't add if it's already in the list (optimistic update)
              if (prev.some(block => block.id === newBlock.id)) {
                return prev;
              }
              return [...prev, newBlock].sort((a, b) => a.pos - b.pos);
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedBlock = payload.new as Block;
            setBlocks(prev => prev.map(block => 
              block.id === updatedBlock.id ? updatedBlock : block
            ).sort((a, b) => a.pos - b.pos));
          } else if (payload.eventType === 'DELETE') {
            const deletedBlock = payload.old as Block;
            setBlocks(prev => prev.filter(block => block.id !== deletedBlock.id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, pageId]);

  return {
    blocks,
    loading,
    error,
    fetchBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
  };
}
