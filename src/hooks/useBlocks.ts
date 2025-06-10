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
  const subscriptionAttemptRef = useRef<number>(0);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    const optimisticId = `temp-${Date.now()}`;
    
    try {
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
      
      setBlocks(prev => prev.map(block => 
        block.id === optimisticId ? data : block
      ));
      
      return { data, error: null };
    } catch (err) {
      setBlocks(prev => prev.filter(block => block.id !== optimisticId));
      const error = err instanceof Error ? err.message : 'Failed to create block';
      return { data: null, error };
    }
  };

  const updateBlock = async (id: string, updates: Partial<Pick<Block, 'type' | 'content' | 'pos' | 'parent_block_id'>>) => {
    try {
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
      
      setBlocks(prev => prev.map(block => 
        block.id === id ? data : block
      ));
      
      return { data, error: null };
    } catch (err) {
      await fetchBlocks();
      const error = err instanceof Error ? err.message : 'Failed to update block';
      return { data: null, error };
    }
  };

  const deleteBlock = async (id: string) => {
    try {
      const originalBlocks = blocks;
      setBlocks(prev => prev.filter(block => block.id !== id));

      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return { error: null };
    } catch (err) {
      setBlocks(blocks);
      const error = err instanceof Error ? err.message : 'Failed to delete block';
      return { error };
    }
  };

  const cleanup = () => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('Error removing blocks channel:', error);
      }
      channelRef.current = null;
    }
  };

  useEffect(() => {
    if (!pageId || !user) {
      cleanup();
      setBlocks([]);
      setLoading(false);
      return;
    }

    fetchBlocks();

    // Cleanup existing subscription
    cleanup();

    // Add small delay to ensure cleanup is complete
    cleanupTimeoutRef.current = setTimeout(() => {
      // Increment attempt counter to ensure unique channel names
      subscriptionAttemptRef.current += 1;
      const attemptId = subscriptionAttemptRef.current;
      const timestamp = Date.now();

      // Create unique channel name to avoid conflicts
      const channelName = `blocks_${pageId}_${user.id}_${attemptId}_${timestamp}`;
      console.log('Creating blocks channel:', channelName);

      // Create a new channel instance
      const channel = supabase.channel(channelName);

      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocks',
          filter: `page_id=eq.${pageId}`
        },
        (payload) => {
          console.log('Realtime block update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newBlock = payload.new as Block;
            setBlocks(prev => {
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
      );

      // Subscribe only once
      channel.subscribe((status) => {
        console.log('Blocks subscription status:', status);
      });

      channelRef.current = channel;
    }, 150); // Slightly longer delay than presence

    return cleanup;
  }, [user?.id, pageId]);

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
