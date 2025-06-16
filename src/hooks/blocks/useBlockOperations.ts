
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Block, BlockType, BlockUpdateParams } from './types';
import { BlockOperationsService } from '@/services/blockOperationsService';
import { useBlockRealtime } from './useBlockRealtime';

export function useBlockOperations(workspaceId?: string, pageId?: string) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const { mountedRef } = useBlockRealtime({
    pageId,
    onBlocksChange: setBlocks,
  });

  const fetchBlocks = useCallback(async () => {
    if (!pageId || !workspaceId) {
      setBlocks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await BlockOperationsService.fetchBlocks(pageId, workspaceId);

      if (mountedRef.current) {
        setBlocks(data);
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
  }, [pageId, workspaceId, mountedRef]);

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
      
      const data = await BlockOperationsService.createBlock({
        workspaceId,
        userId: user.id,
        type: params.type,
        content: params.content,
        parent_id: parentId,
        pos: params.pos,
      });

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create block' };
    }
  }, [user, workspaceId, pageId]);

  const updateBlock = useCallback(async (id: string, updates: BlockUpdateParams) => {
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    try {
      const data = await BlockOperationsService.updateBlock(id, updates, user.id);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update block' };
    }
  }, [user]);

  const deleteBlock = useCallback(async (id: string) => {
    try {
      await BlockOperationsService.deleteBlock(id);
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
