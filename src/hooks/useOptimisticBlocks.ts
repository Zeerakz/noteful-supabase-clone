
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

  // Apply optimistic updates to blocks list with proper sorting
  const optimisticBlocks = blocks
    .filter(block => !optimisticDeletions.has(block.id))
    .map(block => {
      const update = optimisticUpdates.get(block.id);
      return update ? { ...block, ...update.updates } : block;
    })
    .concat(optimisticCreations.filter(optimisticBlock => {
      // Only include optimistic creations that haven't been replaced by real blocks
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
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const now = new Date().toISOString();
    const parentId = blockData.parent_id || '';
    
    const optimisticBlock: Block = {
      id: tempId,
      type: blockData.type || 'text',
      workspace_id: blockData.workspace_id || '',
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

    setOptimisticCreations(prev => [...prev, optimisticBlock]);
    
    // Auto-cleanup after 15 seconds (increased from 10)
    setTimeout(() => {
      setOptimisticCreations(current => 
        current.filter(block => block.id !== tempId)
      );
    }, 15000);
    
    return tempId;
  }, [getNextOptimisticPosition]);

  const optimisticUpdateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.set(blockId, {
        id: blockId,
        updates: { ...updates, last_edited_time: new Date().toISOString() },
        timestamp: Date.now(),
      });
      return newMap;
    });

    // Auto-cleanup after 10 seconds (reduced from 30)
    setTimeout(() => {
      setOptimisticUpdates(current => {
        const newMap = new Map(current);
        const update = newMap.get(blockId);
        if (update && Date.now() - update.timestamp > 10000) {
          newMap.delete(blockId);
        }
        return newMap;
      });
    }, 10000);
  }, []);

  const optimisticDeleteBlock = useCallback((blockId: string) => {
    setOptimisticDeletions(prev => new Set(prev).add(blockId));
    
    // Auto-cleanup after 10 seconds (reduced from 30)
    setTimeout(() => {
      setOptimisticDeletions(current => {
        const newSet = new Set(current);
        newSet.delete(blockId);
        return newSet;
      });
    }, 10000);
  }, []);

  const clearOptimisticUpdate = useCallback((blockId: string) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(blockId);
      return newMap;
    });
  }, []);

  const clearOptimisticCreation = useCallback((tempId: string) => {
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
