
import { useState, useCallback } from 'react';
import { Block } from '@/types/block';

interface OptimisticBlockUpdate {
  id: string;
  updates: Partial<Block>;
  timestamp: number;
}

interface UseOptimisticBlocksProps {
  blocks: Block[];
}

export function useOptimisticBlocks({ blocks }: UseOptimisticBlocksProps) {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, OptimisticBlockUpdate>>(new Map());
  const [optimisticCreations, setOptimisticCreations] = useState<Block[]>([]);
  const [optimisticDeletions, setOptimisticDeletions] = useState<Set<string>>(new Set());

  // Helper function to get next position for optimistic blocks
  const getNextOptimisticPosition = useCallback((parentId: string) => {
    // Get all blocks with the same parent (including optimistic ones)
    const siblingBlocks = [
      ...blocks.filter(block => block.parent_id === parentId),
      ...optimisticCreations.filter(block => block.parent_id === parentId)
    ];

    if (siblingBlocks.length === 0) {
      return 0;
    }

    const maxPos = Math.max(...siblingBlocks.map(block => block.pos || 0));
    return maxPos + 1;
  }, [blocks, optimisticCreations]);

  // Apply optimistic updates to blocks list with proper sorting and filtering
  const optimisticBlocks = blocks
    .filter(block => {
      // Filter out deleted blocks and any blocks with temporary IDs (these shouldn't exist in the real blocks array)
      if (optimisticDeletions.has(block.id)) return false;
      if (block.id.startsWith('temp-')) {
        console.warn('Optimistic: Found temporary ID in real blocks array, filtering out:', block.id);
        return false;
      }
      return true;
    })
    .map(block => {
      const update = optimisticUpdates.get(block.id);
      return update ? { ...block, ...update.updates } : block;
    })
    .concat(optimisticCreations.filter(optimisticBlock => {
      // Only include optimistic creations that haven't been replaced by real blocks
      // and ensure they have valid temporary IDs
      if (!optimisticBlock.id.startsWith('temp-')) {
        console.warn('Optimistic: Found non-temporary ID in optimistic creations:', optimisticBlock.id);
        return false;
      }
      return !blocks.some(realBlock => realBlock.id === optimisticBlock.id);
    }))
    .sort((a, b) => {
      // First sort by parent_id to group blocks
      if (a.parent_id !== b.parent_id) {
        return (a.parent_id || '').localeCompare(b.parent_id || '');
      }
      // Then sort by position within the same parent
      return (a.pos || 0) - (b.pos || 0);
    });

  const optimisticCreateBlock = useCallback((blockData: Partial<Block>) => {
    // Generate a more robust temporary ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const now = new Date().toISOString();
    const parentId = blockData.parent_id || '';
    
    // Validate required fields
    if (!blockData.workspace_id) {
      console.error('Optimistic: Cannot create block without workspace_id');
      return tempId;
    }
    
    const optimisticBlock: Block = {
      id: tempId,
      type: blockData.type || 'text',
      workspace_id: blockData.workspace_id,
      teamspace_id: blockData.teamspace_id || null,
      parent_id: parentId,
      properties: blockData.properties || {},
      content: blockData.content || {},
      pos: blockData.pos ?? getNextOptimisticPosition(parentId),
      created_time: now,
      last_edited_time: now,
      created_by: blockData.created_by || null,
      last_edited_by: null,
      archived: false,
      in_trash: false,
    };

    console.log('Optimistic: Creating block', { tempId, parentId, pos: optimisticBlock.pos });
    setOptimisticCreations(prev => {
      // Prevent duplicate temporary IDs
      const existingIndex = prev.findIndex(block => block.id === tempId);
      if (existingIndex >= 0) {
        console.warn('Optimistic: Duplicate temporary ID detected, replacing:', tempId);
        const newCreations = [...prev];
        newCreations[existingIndex] = optimisticBlock;
        return newCreations;
      }
      
      const newCreations = [...prev, optimisticBlock];
      console.log('Optimistic: Updated creations list', newCreations.length);
      return newCreations;
    });
    
    // Enhanced auto-cleanup with longer timeout since we increased the clear delay
    setTimeout(() => {
      setOptimisticCreations(current => {
        const filtered = current.filter(block => block.id !== tempId);
        if (filtered.length !== current.length) {
          console.log('Optimistic: Auto-cleanup for', tempId);
        }
        return filtered;
      });
    }, 30000); // Increased to 30 seconds to match the longer clear delays
    
    return tempId;
  }, [getNextOptimisticPosition]);

  const optimisticUpdateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    // Validate that we're not updating with invalid data
    if (!blockId || blockId.trim() === '') {
      console.error('Optimistic: Cannot update block with empty ID');
      return;
    }

    // Special handling for temporary IDs - we can update them optimistically but warn
    if (blockId.startsWith('temp-')) {
      console.warn('Optimistic: Updating temporary block (this is unusual):', blockId);
    }

    console.log('Optimistic: Updating block', blockId, updates);
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.set(blockId, {
        id: blockId,
        updates: { ...updates, last_edited_time: new Date().toISOString() },
        timestamp: Date.now(),
      });
      return newMap;
    });

    // Auto-cleanup with enhanced timing
    setTimeout(() => {
      setOptimisticUpdates(current => {
        const newMap = new Map(current);
        const update = newMap.get(blockId);
        if (update && Date.now() - update.timestamp > 20000) {
          newMap.delete(blockId);
          console.log('Optimistic: Auto-cleanup update for', blockId);
        }
        return newMap;
      });
    }, 20000); // Increased timeout to match longer delays
  }, []);

  const optimisticDeleteBlock = useCallback((blockId: string) => {
    // Validate block ID
    if (!blockId || blockId.trim() === '') {
      console.error('Optimistic: Cannot delete block with empty ID');
      return;
    }

    console.log('Optimistic: Deleting block', blockId);
    setOptimisticDeletions(prev => new Set(prev).add(blockId));
    
    // Auto-cleanup
    setTimeout(() => {
      setOptimisticDeletions(current => {
        const newSet = new Set(current);
        if (newSet.delete(blockId)) {
          console.log('Optimistic: Auto-cleanup deletion for', blockId);
        }
        return newSet;
      });
    }, 20000); // Increased timeout
  }, []);

  const clearOptimisticUpdate = useCallback((blockId: string) => {
    console.log('Optimistic: Clearing update for', blockId);
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(blockId);
      return newMap;
    });
  }, []);

  const clearOptimisticCreation = useCallback((tempId: string) => {
    console.log('Optimistic: Clearing creation for', tempId);
    setOptimisticCreations(prev => prev.filter(block => block.id !== tempId));
  }, []);

  const clearOptimisticDeletion = useCallback((blockId: string) => {
    setOptimisticDeletions(prev => {
      const newSet = new Set(prev);
      newSet.delete(blockId);
      return newSet;
    });
  }, []);

  const revertAllOptimisticChanges = useCallback(() => {
    console.log('Optimistic: Reverting all changes');
    setOptimisticUpdates(new Map());
    setOptimisticCreations([]);
    setOptimisticDeletions(new Set());
  }, []);

  return {
    optimisticBlocks,
    optimisticCreateBlock,
    optimisticUpdateBlock,
    optimisticDeleteBlock,
    clearOptimisticUpdate,
    clearOptimisticCreation,
    clearOptimisticDeletion,
    revertAllOptimisticChanges,
    hasOptimisticChanges: optimisticUpdates.size > 0 || optimisticCreations.length > 0 || optimisticDeletions.size > 0,
  };
}
