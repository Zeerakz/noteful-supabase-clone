
// Query key factory types
export interface BlocksQueryFilters {
  type?: string;
  search?: string;
  status?: string;
  [key: string]: any;
}

// Simplified query key type that properly extends array
export type BlocksQueryKey = readonly ['blocks', string, string, BlocksQueryFilters];

// Query key factory for blocks
export const blocksQueryKeys = {
  all: ['blocks'] as const,
  
  workspace: (workspaceId: string) =>
    ['blocks', workspaceId] as const,
  
  page: (workspaceId: string, pageId: string) =>
    ['blocks', workspaceId, pageId] as const,
  
  filtered: (workspaceId: string, pageId: string, filters: BlocksQueryFilters = {}): BlocksQueryKey =>
    ['blocks', workspaceId, pageId, filters] as const,
  
  // Helper to create query key for specific block
  block: (workspaceId: string, pageId: string, blockId: string) =>
    ['blocks', workspaceId, pageId, { blockId }] as const,
};

// Type guard to check if a query key is a blocks query
export const isBlocksQueryKey = (queryKey: readonly unknown[]): queryKey is BlocksQueryKey => {
  return Array.isArray(queryKey) && queryKey[0] === 'blocks' && queryKey.length >= 4;
};
