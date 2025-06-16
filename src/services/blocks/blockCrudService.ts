
import { supabase } from '@/integrations/supabase/client';
import { Block, BlockType, BlockUpdateParams } from '@/hooks/blocks/types';
import { normalizeBlock } from './blockNormalizationService';
import { BlockPositionService } from './blockPositionService';

export class BlockCrudService {
  /**
   * Fetch all blocks for a given page
   */
  static async fetchBlocks(pageId: string, workspaceId: string): Promise<Block[]> {
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('parent_id', pageId)
      .order('pos', { ascending: true });

    if (error) throw error;

    return (data || []).map(normalizeBlock);
  }

  /**
   * Create a new block
   * CRITICAL: This method should NEVER receive a temporary ID
   * The database will generate its own UUID
   */
  static async createBlock(params: {
    workspaceId: string;
    userId: string;
    type: BlockType;
    content?: any;
    parent_id?: string;
    pos?: number;
  }): Promise<Block> {
    // Validate that we don't have any temporary IDs in the params
    if (params.parent_id?.startsWith('temp-')) {
      throw new Error('Cannot create block with temporary parent ID');
    }

    const nextPos = params.pos !== undefined 
      ? params.pos 
      : await BlockPositionService.getNextBlockPosition(params.parent_id || '');

    // Construct the insert payload without any ID field
    // The database will auto-generate the UUID
    const insertPayload = {
      workspace_id: params.workspaceId,
      type: params.type,
      parent_id: params.parent_id,
      content: params.content || {},
      pos: nextPos,
      created_by: params.userId,
      last_edited_by: params.userId,
      properties: {},
      // Explicitly NOT including 'id' - let database generate it
    };

    console.log('BlockCrudService: Creating block with payload:', insertPayload);

    const { data, error } = await supabase
      .from('blocks')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('BlockCrudService: Error creating block:', error);
      throw error;
    }

    console.log('BlockCrudService: Successfully created block:', data);
    return normalizeBlock(data);
  }

  /**
   * Update an existing block
   * Validates that the ID is not a temporary ID
   */
  static async updateBlock(id: string, updates: BlockUpdateParams, userId: string): Promise<Block> {
    // Validate that we're not trying to update with a temporary ID
    if (id.startsWith('temp-')) {
      throw new Error('Cannot update block with temporary ID');
    }

    // Convert our updates to match Supabase schema
    const supabaseUpdates: any = {
      ...updates,
      last_edited_by: userId,
      last_edited_time: new Date().toISOString(),
    };

    // Ensure properties is JSON-compatible
    if (updates.properties) {
      supabaseUpdates.properties = updates.properties;
    }

    // Ensure content is JSON-compatible
    if (updates.content !== undefined) {
      supabaseUpdates.content = updates.content;
    }

    // Validate any parent_id is not temporary
    if (supabaseUpdates.parent_id?.startsWith('temp-')) {
      throw new Error('Cannot update block with temporary parent ID');
    }

    console.log('BlockCrudService: Updating block:', id, supabaseUpdates);

    const { data, error } = await supabase
      .from('blocks')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('BlockCrudService: Error updating block:', error);
      throw error;
    }

    return normalizeBlock(data);
  }

  /**
   * Delete a block
   * Validates that the ID is not a temporary ID
   */
  static async deleteBlock(id: string): Promise<void> {
    // Validate that we're not trying to delete with a temporary ID
    if (id.startsWith('temp-')) {
      throw new Error('Cannot delete block with temporary ID');
    }

    console.log('BlockCrudService: Deleting block:', id);

    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('BlockCrudService: Error deleting block:', error);
      throw error;
    }
  }
}
