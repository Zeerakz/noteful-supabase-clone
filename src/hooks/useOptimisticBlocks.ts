import { Block } from '@/types/block';
import { useOptimisticState } from '@/hooks/useOptimisticState';

interface UseOptimisticBlocksProps {
  blocks: Block[];
}

export function useOptimisticBlocks({ blocks }: UseOptimisticBlocksProps) {
  const {
    optimisticData: optimisticBlocks,
    applyOptimisticUpdate,
    clearOptimisticUpdate,
    clearOptimisticByMatch,
    hasOptimisticChanges,
    revertAllOptimisticChanges,
  } = useOptimisticState<Block>(blocks, {
    keyExtractor: (block) => block.id,
    matcher: (serverBlock, optimisticBlock) => {
      // Match by parent_id, type, and position for newly created blocks
      return serverBlock.parent_id === optimisticBlock.parent_id &&
             serverBlock.type === optimisticBlock.type &&
             Math.abs((serverBlock.pos || 0) - (optimisticBlock.pos || 0)) <= 1 &&
             Math.abs(new Date(serverBlock.created_time).getTime() - new Date(optimisticBlock.created_time).getTime()) < 10000;
    }
  });

  const optimisticCreateBlock = (blockData: Partial<Block>) => {
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const optimisticBlock: Block = {
      id: tempId,
      type: blockData.type || 'text',
      workspace_id: blockData.workspace_id || '',
      teamspace_id: blockData.teamspace_id || null,
      parent_id: blockData.parent_id || '',
      properties: blockData.properties || {},
      content: blockData.content || {},
      pos: blockData.pos ?? Date.now() % 1000000,
      created_time: now,
      last_edited_time: now,
      created_by: blockData.created_by || null,
      last_edited_by: null,
      archived: false,
      in_trash: false,
    };

    return applyOptimisticUpdate('create', optimisticBlock, tempId);
  };

  const optimisticUpdateBlock = (blockId: string, updates: Partial<Block>) => {
    const existingBlock = blocks.find(b => b.id === blockId);
    if (!existingBlock) return;

    const updatedBlock = {
      ...existingBlock,
      ...updates,
      last_edited_time: new Date().toISOString(),
    };

    applyOptimisticUpdate('update', updatedBlock);
  };

  const optimisticDeleteBlock = (blockId: string) => {
    const existingBlock = blocks.find(b => b.id === blockId);
    if (!existingBlock) return;

    applyOptimisticUpdate('delete', existingBlock);
  };

  const clearOptimisticCreation = (tempId: string) => {
    clearOptimisticUpdate(tempId);
  };

  const clearOptimisticCreationByMatch = (serverBlock: Block) => {
    clearOptimisticByMatch(serverBlock);
  };

  const clearOptimisticDeletion = (blockId: string) => {
    clearOptimisticUpdate(blockId);
  };

  return {
    optimisticBlocks,
    optimisticCreateBlock,
    optimisticUpdateBlock,
    optimisticDeleteBlock,
    clearOptimisticUpdate,
    clearOptimisticCreation,
    clearOptimisticCreationByMatch,
    clearOptimisticDeletion,
    revertAllOptimisticChanges,
    hasOptimisticChanges,
  };
}
