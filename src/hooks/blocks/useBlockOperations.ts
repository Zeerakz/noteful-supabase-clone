
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Block, BlockCreateParams, BlockUpdateParams, BlockOperationResult } from './types';
import { blockCreationService } from './useBlockCreation';

export function useBlockOperations(pageId?: string) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBlocks = async () => {
    if (!user || !pageId) {
      setBlocks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching blocks for page:', pageId);
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('page_id', pageId)
        .order('pos', { ascending: true });

      if (error) throw error;
      console.log('Fetched blocks:', data);
      setBlocks(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching blocks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch blocks');
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch blocks when pageId or user changes
  useEffect(() => {
    fetchBlocks();
  }, [pageId, user?.id]);

  const createBlock = async (type: string, content: any = {}, parentBlockId?: string): Promise<BlockOperationResult<Block>> => {
    if (!user || !pageId) return { error: 'User not authenticated or page not selected', data: null };

    const optimisticId = `temp-${Date.now()}`;
    
    try {
      // Get the position for the new block
      const nextPos = blockCreationService.getDefaultPosition(blocks, parentBlockId);
      
      // Get the initial content for the block type
      const initialContent = blockCreationService.getInitialContent(type, content);

      const newBlock: Block = {
        id: optimisticId,
        page_id: pageId,
        parent_block_id: parentBlockId || null,
        type,
        content: initialContent,
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
            content: initialContent,
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

  const updateBlock = async (id: string, updates: BlockUpdateParams): Promise<BlockOperationResult<Block>> => {
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

  const deleteBlock = async (id: string): Promise<BlockOperationResult<void>> => {
    try {
      const originalBlocks = blocks;
      setBlocks(prev => prev.filter(block => block.id !== id));

      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return { data: null, error: null };
    } catch (err) {
      setBlocks(blocks);
      const error = err instanceof Error ? err.message : 'Failed to delete block';
      return { data: null, error };
    }
  };

  return {
    blocks,
    setBlocks,
    loading,
    error,
    fetchBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
  };
}
