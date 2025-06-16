
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
   */
  static async createBlock(params: {
    workspaceId: string;
    userId: string;
    type: BlockType;
    content?: any;
    parent_id?: string;
    pos?: number;
  }): Promise<Block> {
    const nextPos = params.pos !== undefined 
      ? params.pos 
      : await BlockPositionService.getNextBlockPosition(params.parent_id || '');

    const { data, error } = await supabase
      .from('blocks')
      .insert({
        workspace_id: params.workspaceId,
        type: params.type,
        parent_id: params.parent_id,
        content: params.content || {},
        pos: nextPos,
        created_by: params.userId,
        last_edited_by: params.userId,
        properties: {},
      })
      .select()
      .single();

    if (error) throw error;

    return normalizeBlock(data);
  }

  /**
   * Update an existing block
   */
  static async updateBlock(id: string, updates: BlockUpdateParams, userId: string): Promise<Block> {
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

    const { data, error } = await supabase
      .from('blocks')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return normalizeBlock(data);
  }

  /**
   * Delete a block
   */
  static async deleteBlock(id: string): Promise<void> {
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
