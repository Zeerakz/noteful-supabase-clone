
import { supabase } from '@/integrations/supabase/client';
import { Block, BlockType, BlockUpdateParams } from '@/hooks/blocks/types';

// Helper function to convert Supabase data to our Block type
export const normalizeBlock = (data: any): Block => ({
  ...data,
  properties: data.properties && typeof data.properties === 'object' ? data.properties : {},
  content: data.content && typeof data.content === 'object' ? data.content : null,
});

export class BlockOperationsService {
  static async fetchBlocks(pageId: string, workspaceId: string): Promise<Block[]> {
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('parent_id', pageId)
      .order('pos', { ascending: true });

    if (error) throw error;

    return (data || []).map(normalizeBlock);
  }

  static async getNextBlockPosition(parentId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('pos')
        .eq('parent_id', parentId)
        .order('pos', { ascending: false })
        .limit(1);

      if (error) throw error;

      const maxPos = data && data.length > 0 ? data[0].pos : -1;
      return maxPos + 1;
    } catch (err) {
      console.error('Error getting next block position:', err);
      // Fallback to a simple increment if query fails
      return Date.now() % 1000000; // Use modulo to keep within integer range
    }
  }

  static async createBlock(params: {
    workspaceId: string;
    userId: string;
    type: BlockType;
    content?: any;
    parent_id?: string;
    pos?: number;
  }) {
    const nextPos = params.pos !== undefined ? params.pos : await this.getNextBlockPosition(params.parent_id || '');

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

  static async updateBlock(id: string, updates: BlockUpdateParams, userId: string) {
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

  static async deleteBlock(id: string) {
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
