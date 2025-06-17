
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Block, BlockType } from '@/types/block';
import { useToast } from '@/hooks/use-toast';

export function useBlockOperations(workspaceId?: string, pageId?: string) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBlocks = useCallback(async () => {
    if (!pageId || !workspaceId) {
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
        .eq('workspace_id', workspaceId)
        .eq('archived', false)
        .eq('in_trash', false)
        .order('pos', { ascending: true });

      if (error) throw error;

      console.log('📦 Fetched blocks:', data);
      setBlocks(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch blocks';
      setError(errorMessage);
      console.error('❌ Error fetching blocks:', err);
    } finally {
      setLoading(false);
    }
  }, [pageId, workspaceId]);

  const createBlock = useCallback(async (params: {
    type: BlockType;
    content?: any;
    parent_id?: string;
    pos?: number;
  }) => {
    if (!user || !workspaceId || !pageId) {
      const error = 'Missing required parameters for block creation';
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      return { data: null, error };
    }

    try {
      const blockData = {
        type: params.type,
        workspace_id: workspaceId,
        parent_id: params.parent_id || pageId,
        content: params.content || {},
        properties: {},
        pos: params.pos ?? Date.now() % 1000000,
        created_by: user.id,
        last_edited_by: user.id,
        created_time: new Date().toISOString(),
        last_edited_time: new Date().toISOString(),
        archived: false,
        in_trash: false,
        teamspace_id: null,
      };

      const { data, error } = await supabase
        .from('blocks')
        .insert(blockData)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Block created:', data);
      
      // Add to local state optimistically
      setBlocks(prev => [...prev, data].sort((a, b) => (a.pos || 0) - (b.pos || 0)));
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create block';
      console.error('❌ Error creating block:', err);
      return { data: null, error: errorMessage };
    }
  }, [user, workspaceId, pageId, toast]);

  const updateBlock = useCallback(async (id: string, updates: Partial<Block>) => {
    if (!user) {
      const error = 'User not authenticated';
      return { data: null, error };
    }

    try {
      const updateData = {
        ...updates,
        last_edited_by: user.id,
        last_edited_time: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('blocks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Block updated:', data);
      
      // Update local state
      setBlocks(prev => prev.map(block => 
        block.id === id ? { ...block, ...data } : block
      ));
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update block';
      console.error('❌ Error updating block:', err);
      return { data: null, error: errorMessage };
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
      
      // Remove from local state
      setBlocks(prev => prev.filter(block => block.id !== id));
      
      return { data: null, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete block';
      console.error('❌ Error deleting block:', err);
      return { data: null, error: errorMessage };
    }
  }, []);

  const refetch = useCallback(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  return {
    blocks,
    setBlocks,
    loading,
    error,
    createBlock,
    updateBlock,
    deleteBlock,
    refetch,
  };
}
