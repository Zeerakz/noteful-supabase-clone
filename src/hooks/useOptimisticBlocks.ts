
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

  // Apply optimistic updates to the blocks list
  const optimisticBlocks = blocks
    .filter(block => !optimisticDeletions.has(block.id))
    .map(block => {
      const update = optimisticUpdates.get(block.id);
      return update ? { ...block, ...update.updates } : block;
    })
    .concat(optimisticCreations)
    .sort((a, b) => a.pos - b.pos);

  const optimisticCreateBlock = useCallback((blockData: Partial<Block>) => {
    const tempId = `temp-block-${Date.now()}-${Math.random()}`;
    const optimisticBlock: Block = {
      id: tempId,
      workspace_id: blockData.workspace_id || '',
      type: blockData.type || 'text',
      parent_id: blockData.parent_id || null,
      properties: blockData.properties || {},
      content: blockData.content || {},
      pos: blockData.pos ?? Date.now(),
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
      created_by: blockData.created_by || null,
      last_edited_by: null,
      archived: false,
      in_trash: false,
      ...blockData,
    };

    setOptimisticCreations(prev => [...prev, optimisticBlock]);
    return tempId;
  }, []);

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
  }, []);

  const optimisticDeleteBlock = useCallback((blockId: string) => {
    setOptimisticDeletions(prev => new Set(prev).add(blockId));
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
    revertAllOptimisticChanges,
    hasOptimisticChanges: optimisticUpdates.size > 0 || optimisticCreations.length > 0 || optimisticDeletions.size > 0,
  };
}
