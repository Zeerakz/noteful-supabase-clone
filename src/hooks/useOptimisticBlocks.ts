
import { useState, useCallback } from 'react';
import { Block } from '@/hooks/blocks/types';

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
      page_id: blockData.page_id || '',
      parent_block_id: blockData.parent_block_id || null,
      type: blockData.type || 'text',
      content: blockData.content || {},
      pos: blockData.pos || Date.now(),
      created_by: blockData.created_by || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
        updates: { ...updates, updated_at: new Date().toISOString() },
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
