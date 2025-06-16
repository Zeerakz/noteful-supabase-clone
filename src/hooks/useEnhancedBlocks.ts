
import { useBlockOperations } from '@/hooks/blocks/useBlockOperations';

export function useEnhancedBlocks(pageId?: string, workspaceId?: string) {
  const blockData = useBlockOperations(workspaceId, pageId);

  return {
    blocks: blockData.blocks,
    loading: blockData.loading,
    error: blockData.error,
    createBlock: blockData.createBlock,
    updateBlock: blockData.updateBlock,
    deleteBlock: blockData.deleteBlock,
    fetchBlocks: blockData.refetch,
    hasOptimisticChanges: false,
  };
}
