
import { useState, useCallback } from 'react';
import { Block, ExtendedBlockType, BlockType } from '@/types/block';

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

  // Apply optimistic updates to blocks list
  const optimisticBlocks = blocks
    .filter(block => !optimisticDeletions.has(block.id))
    .map(block => {
      const update = optimisticUpdates.get(block.id);
      return update ? { ...block, ...update.updates } : block;
    })
    .concat(optimisticCreations.filter(optimisticBlock => {
      // Only include optimistic creations that haven't been replaced by real blocks
      // Check by matching parent_id, type, and position instead of ID
      return !blocks.some(realBlock => 
        realBlock.parent_id === optimisticBlock.parent_id &&
        realBlock.type === optimisticBlock.type &&
        Math.abs((realBlock.pos || 0) - (optimisticBlock.pos || 0)) <= 1 &&
        Math.abs(new Date(realBlock.created_time).getTime() - new Date(optimisticBlock.created_time).getTime()) < 10000
      );
    }));

  const optimisticCreateBlock = useCallback((blockData: Partial<Block>) => {
    // Generate a proper UUID v4 for temporary ID
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const parentId = blockData.parent_id || '';
    
    // Ensure we only use core block types that exist in the database
    const coreBlockType = mapToValidBlockType(blockData.type || 'text');
    
    const optimisticBlock: Block = {
      id: tempId,
      type: coreBlockType,
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
    
    // Auto-cleanup after 15 seconds instead of 10
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

    // Auto-cleanup after 30 seconds
    setTimeout(() => {
      setOptimisticUpdates(current => {
        const newMap = new Map(current);
        const update = newMap.get(blockId);
        if (update && Date.now() - update.timestamp > 30000) {
          newMap.delete(blockId);
        }
        return newMap;
      });
    }, 30000);
  }, []);

  const optimisticDeleteBlock = useCallback((blockId: string) => {
    setOptimisticDeletions(prev => new Set(prev).add(blockId));
    
    // Auto-cleanup after 30 seconds
    setTimeout(() => {
      setOptimisticDeletions(current => {
        const newSet = new Set(current);
        newSet.delete(blockId);
        return newSet;
      });
    }, 30000);
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

// Helper function to map extended block types to valid database types
function mapToValidBlockType(type: string): ExtendedBlockType {
  const validTypes: ExtendedBlockType[] = [
    'page', 'database', 'text', 'image', 'heading_1', 'heading_2', 'heading_3',
    'todo_item', 'bulleted_list_item', 'numbered_list_item', 'toggle_list',
    'code', 'quote', 'divider', 'callout', 'two_column', 'table', 'embed', 'file_attachment'
  ];
  
  // Map extended types to core types
  const typeMapping: Record<string, ExtendedBlockType> = {
    'two_column': 'text',
    'table': 'text', 
    'embed': 'text',
    'file_attachment': 'text'
  };
  
  const mappedType = typeMapping[type] || type;
  return validTypes.includes(mappedType as ExtendedBlockType) ? (mappedType as ExtendedBlockType) : 'text';
}
