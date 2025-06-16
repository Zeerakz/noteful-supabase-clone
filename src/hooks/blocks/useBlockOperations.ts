
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Block, BlockType, BlockUpdateParams } from './types';
import { BlockOperationsService } from '@/services/blockOperationsService';
import { useBlockRealtime } from './useBlockRealtime';
import { useToast } from '@/hooks/use-toast';

export function useBlockOperations(workspaceId?: string, pageId?: string) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { mountedRef, connectionStatus, reconnect } = useBlockRealtime({
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch blocks';
      console.error('Error fetching blocks:', err);
      
      if (mountedRef.current) {
        setError(errorMessage);
        toast({
          title: "Error",
          description: "Failed to load page content. Please refresh and try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [pageId, workspaceId, mountedRef, toast]);

  const createBlock = useCallback(async (params: {
    type: BlockType;
    content?: any;
    parent_id?: string;
    pos?: number;
  }) => {
    if (!user || !workspaceId || !pageId) {
      const errorMessage = 'Missing required parameters - user not authenticated or workspace/page not selected';
      toast({
        title: "Error",
        description: "Cannot create block. Please ensure you're logged in and have selected a workspace.",
        variant: "destructive",
      });
      return { data: null, error: errorMessage };
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

      toast({
        title: "Success",
        description: `Successfully created a new ${params.type.replace('_', ' ')} block.`,
      });

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create block';
      console.error('Error creating block:', err);
      
      let userMessage = "Failed to create block. Please try again.";
      if (errorMessage.includes('permission')) {
        userMessage = "You don't have permission to create blocks in this workspace.";
      } else if (errorMessage.includes('position')) {
        userMessage = "Could not determine block position. Please refresh the page and try again.";
      } else if (errorMessage.includes('violates row-level security')) {
        userMessage = "Permission denied. Please check your workspace access.";
      }
      
      toast({
        title: "Error",
        description: userMessage,
        variant: "destructive",
      });
      
      return { data: null, error: errorMessage };
    }
  }, [user, workspaceId, pageId, toast]);

  const updateBlock = useCallback(async (id: string, updates: BlockUpdateParams) => {
    if (!user) {
      const errorMessage = 'User not authenticated';
      toast({
        title: "Error",
        description: "You must be logged in to update blocks.",
        variant: "destructive",
      });
      return { data: null, error: errorMessage };
    }

    try {
      const data = await BlockOperationsService.updateBlock(id, updates, user.id);
      
      if (updates.content || updates.type) {
        toast({
          title: "Success",
          description: "Block updated successfully.",
        });
      }
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update block';
      console.error('Error updating block:', err);
      
      let userMessage = "Failed to update block. Please try again.";
      if (errorMessage.includes('permission')) {
        userMessage = "You don't have permission to update this block.";
      } else if (errorMessage.includes('not found')) {
        userMessage = "Block not found. It may have been deleted.";
      }
      
      toast({
        title: "Error",
        description: userMessage,
        variant: "destructive",
      });
      
      return { data: null, error: errorMessage };
    }
  }, [user, toast]);

  const deleteBlock = useCallback(async (id: string) => {
    if (!user) {
      const errorMessage = 'User not authenticated';
      toast({
        title: "Error",
        description: "You must be logged in to delete blocks.",
        variant: "destructive",
      });
      return { error: errorMessage };
    }

    try {
      await BlockOperationsService.deleteBlock(id);
      
      toast({
        title: "Success",
        description: "Block deleted successfully.",
      });
      
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete block';
      console.error('Error deleting block:', err);
      
      let userMessage = "Failed to delete block. Please try again.";
      if (errorMessage.includes('permission')) {
        userMessage = "You don't have permission to delete this block.";
      } else if (errorMessage.includes('not found')) {
        userMessage = "Block not found. It may have already been deleted.";
      }
      
      toast({
        title: "Error",
        description: userMessage,
        variant: "destructive",
      });
      
      return { error: errorMessage };
    }
  }, [user, toast]);

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
    connectionStatus,
    reconnect,
  };
}
