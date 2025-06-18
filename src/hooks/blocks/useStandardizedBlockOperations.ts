
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Block, BlockType } from '@/types/block';
import { useToast } from '@/hooks/use-toast';

// Enhanced error handling
interface BlockOperationError {
  type: 'network' | 'validation' | 'permission' | 'unknown';
  message: string;
  blockId?: string;
  operation?: string;
}

export function useStandardizedBlockOperations(workspaceId?: string, pageId?: string) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Enhanced error handler
  const handleError = useCallback((error: any, operation: string, blockId?: string): BlockOperationError => {
    console.error(`❌ Block ${operation} error:`, error);
    
    let errorType: BlockOperationError['type'] = 'unknown';
    let message = `Failed to ${operation} block`;

    if (error?.message?.includes('permission') || error?.code === '42501') {
      errorType = 'permission';
      message = `Permission denied for ${operation}`;
    } else if (error?.message?.includes('network') || error?.code === 'PGRST301') {
      errorType = 'network';
      message = `Network error during ${operation}`;
    } else if (error?.message?.includes('validation')) {
      errorType = 'validation';
      message = error.message;
    } else if (error?.message) {
      message = error.message;
    }

    const blockError: BlockOperationError = {
      type: errorType,
      message,
      blockId,
      operation
    };

    // Show user-friendly toast
    toast({
      title: "Block Operation Failed",
      description: message,
      variant: "destructive",
    });

    return blockError;
  }, [toast]);

  // Transform Supabase data to Block type
  const transformSupabaseDataToBlock = useCallback((data: any): Block => {
    return {
      ...data,
      properties: data.properties || {},
      content: data.content || {},
      created_by: data.created_by || null,
      last_edited_by: data.last_edited_by || null,
      teamspace_id: data.teamspace_id || null,
    };
  }, []);

  // Fetch blocks with better error handling
  const fetchBlocks = useCallback(async () => {
    if (!pageId || !workspaceId) {
      setLoading(false);
      return { data: [], error: null };
    }

    try {
      setLoading(true);
      setError(null);
      console.log('📦 Fetching blocks for page:', pageId);

      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('parent_id', pageId)
        .eq('workspace_id', workspaceId)
        .eq('archived', false)
        .eq('in_trash', false)
        .order('pos', { ascending: true });

      if (error) throw error;

      const transformedBlocks = (data || []).map(transformSupabaseDataToBlock);
      console.log('✅ Fetched blocks:', transformedBlocks.length);
      
      setBlocks(transformedBlocks);
      return { data: transformedBlocks, error: null };
    } catch (err) {
      const blockError = handleError(err, 'fetch');
      setError(blockError.message);
      return { data: [], error: blockError.message };
    } finally {
      setLoading(false);
    }
  }, [pageId, workspaceId, transformSupabaseDataToBlock, handleError]);

  // Create block with comprehensive validation
  const createBlock = useCallback(async (params: {
    type: BlockType;
    content?: any;
    parent_id?: string;
    pos?: number;
  }) => {
    if (!user || !workspaceId || !pageId) {
      const error = 'Missing required parameters for block creation';
      handleError(new Error(error), 'create');
      return { data: null, error };
    }

    const operationId = `create-${Date.now()}`;
    setOperationInProgress(operationId);

    try {
      console.log('➕ Creating block:', params);

      // Validate content based on block type
      let validatedContent = params.content || {};
      if (params.type === 'text' && (!validatedContent.text || validatedContent.text.trim() === '')) {
        validatedContent = { text: 'New text block' };
      }

      const blockData = {
        type: params.type,
        workspace_id: workspaceId,
        parent_id: params.parent_id || pageId,
        content: validatedContent,
        properties: {},
        pos: params.pos ?? Math.floor(Date.now() / 1000),
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

      const transformedBlock = transformSupabaseDataToBlock(data);
      console.log('✅ Block created successfully:', transformedBlock.id);
      
      // Optimistically update local state
      setBlocks(prev => [...prev, transformedBlock].sort((a, b) => (a.pos || 0) - (b.pos || 0)));
      
      toast({
        title: "Block Created",
        description: "Block has been created successfully",
      });

      return { data: transformedBlock, error: null };
    } catch (err) {
      const blockError = handleError(err, 'create');
      return { data: null, error: blockError.message };
    } finally {
      setOperationInProgress(null);
    }
  }, [user, workspaceId, pageId, transformSupabaseDataToBlock, handleError, toast]);

  // Update block with retry logic
  const updateBlock = useCallback(async (id: string, updates: Partial<Block>, retryCount = 0) => {
    if (!user) {
      const error = 'User not authenticated';
      handleError(new Error(error), 'update', id);
      return { data: null, error };
    }

    const operationId = `update-${id}-${Date.now()}`;
    setOperationInProgress(operationId);

    try {
      console.log('🔄 Updating block:', id, updates);

      // Validate updates
      const updateData = {
        ...updates,
        last_edited_by: user.id,
        last_edited_time: new Date().toISOString(),
      };

      // Special validation for text blocks
      if (updates.content && 'text' in updates.content) {
        const text = updates.content.text;
        if (typeof text === 'string' && text.trim().length === 0) {
          console.log('⚠️ Skipping empty text update');
          return { data: null, error: null };
        }
      }

      const { data, error } = await supabase
        .from('blocks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const transformedBlock = transformSupabaseDataToBlock(data);
      console.log('✅ Block updated successfully:', id);
      
      // Update local state
      setBlocks(prev => prev.map(block => 
        block.id === id ? transformedBlock : block
      ));
      
      return { data: transformedBlock, error: null };
    } catch (err) {
      // Retry logic for network errors
      if (retryCount < 2 && (err as any)?.code === 'PGRST301') {
        console.log(`🔄 Retrying update for block ${id} (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return updateBlock(id, updates, retryCount + 1);
      }

      const blockError = handleError(err, 'update', id);
      return { data: null, error: blockError.message };
    } finally {
      setOperationInProgress(null);
    }
  }, [user, transformSupabaseDataToBlock, handleError]);

  // Delete block
  const deleteBlock = useCallback(async (id: string) => {
    const operationId = `delete-${id}-${Date.now()}`;
    setOperationInProgress(operationId);

    try {
      console.log('🗑️ Deleting block:', id);

      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Block deleted successfully:', id);
      
      // Update local state
      setBlocks(prev => prev.filter(block => block.id !== id));
      
      toast({
        title: "Block Deleted",
        description: "Block has been deleted successfully",
      });
      
      return { data: null, error: null };
    } catch (err) {
      const blockError = handleError(err, 'delete', id);
      return { data: null, error: blockError.message };
    } finally {
      setOperationInProgress(null);
    }
  }, [handleError, toast]);

  // Initialize
  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  return {
    blocks,
    setBlocks,
    loading,
    error,
    operationInProgress,
    createBlock,
    updateBlock,
    deleteBlock,
    refetch: fetchBlocks,
  };
}
