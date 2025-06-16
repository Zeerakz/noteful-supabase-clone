
import { Block, BlockType, BlockUpdateParams } from '@/hooks/blocks/types';
import { BlockCrudService } from './blocks/blockCrudService';
import { BlockPositionService } from './blocks/blockPositionService';
import { normalizeBlock } from './blocks/blockNormalizationService';

// Re-export the normalize function for backward compatibility
export { normalizeBlock };

/**
 * Main service for block operations
 * This acts as a facade that delegates to the appropriate specialized services
 */
export class BlockOperationsService {
  static async fetchBlocks(pageId: string, workspaceId: string): Promise<Block[]> {
    return BlockCrudService.fetchBlocks(pageId, workspaceId);
  }

  static async getNextBlockPosition(parentId: string): Promise<number> {
    return BlockPositionService.getNextBlockPosition(parentId);
  }

  static async createBlock(params: {
    workspaceId: string;
    userId: string;
    type: BlockType;
    content?: any;
    parent_id?: string;
    pos?: number;
  }): Promise<Block> {
    return BlockCrudService.createBlock(params);
  }

  static async updateBlock(id: string, updates: BlockUpdateParams, userId: string): Promise<Block> {
    return BlockCrudService.updateBlock(id, updates, userId);
  }

  static async deleteBlock(id: string): Promise<void> {
    return BlockCrudService.deleteBlock(id);
  }
}
