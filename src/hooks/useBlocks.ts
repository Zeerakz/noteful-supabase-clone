
import { useState, useEffect } from 'react';
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
      
      // Refresh blocks list
      await fetchBlocks();
      
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create block';
      return { data: null, error };
    }
  };

  const updateBlock = async (id: string, updates: Partial<Pick<Block, 'type' | 'content' | 'pos' | 'parent_block_id'>>) => {
    try {
      const { data, error } = await supabase
        .from('blocks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh blocks list
      await fetchBlocks();
      
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update block';
      return { data: null, error };
    }
  };

  const deleteBlock = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh blocks list
      await fetchBlocks();
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete block';
      return { error };
    }
  };

  useEffect(() => {
    fetchBlocks();
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
