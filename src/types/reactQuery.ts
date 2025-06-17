
import { QueryKey, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { Block } from './block';
import { BlocksQueryFilters } from '@/hooks/blocks/queryKeys';

// Base query options for blocks
export interface BlocksQueryOptions extends Omit<UseQueryOptions<Block[], Error>, 'queryKey' | 'queryFn'> {
  filters?: BlocksQueryFilters;
}

// Mutation options for blocks
export interface CreateBlockMutationOptions extends UseMutationOptions<Block, Error, Partial<Block>> {}
export interface UpdateBlockMutationOptions extends UseMutationOptions<Block, Error, { id: string; updates: Partial<Block> }> {}
export interface DeleteBlockMutationOptions extends UseMutationOptions<string, Error, string> {}

// Query client context type
export interface BlocksQueryContext {
  workspaceId: string;
  pageId: string;
  filters?: BlocksQueryFilters;
}

// Extended query key type with proper typing
export type BlocksQueryKeyType = readonly [
  'blocks',
  string, // workspaceId
  string, // pageId
  BlocksQueryFilters // filters
];

// Query key factory return types
export interface BlocksQueryKeyFactory {
  all: readonly ['blocks'];
  workspace: (workspaceId: string) => readonly ['blocks', string];
  page: (workspaceId: string, pageId: string) => readonly ['blocks', string, string];
  filtered: (workspaceId: string, pageId: string, filters?: BlocksQueryFilters) => BlocksQueryKeyType;
  block: (workspaceId: string, pageId: string, blockId: string) => readonly ['blocks', string, string, { blockId: string }];
}

// React Query configuration for blocks
export interface BlocksReactQueryConfig {
  staleTime: 30000; // 30 seconds
  gcTime: 300000; // 5 minutes
  retry: number;
  refetchOnWindowFocus: boolean;
  refetchOnReconnect: boolean;
}
