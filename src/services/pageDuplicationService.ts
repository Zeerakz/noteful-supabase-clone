
import { supabase } from '@/integrations/supabase/client';
import { Block } from '@/types/block';
import { blockCreationService } from '@/hooks/blocks/useBlockCreation';

export class PageDuplicationService {
  static async duplicatePage(
    originalPageId: string,
    userId: string
  ): Promise<{ data: Block | null; error: string | null }> {
    try {
      // Fetch the original page
      const { data: originalPage, error: pageError } = await supabase
        .from('blocks')
        .select('*')
        .eq('id', originalPageId)
        .eq('type', 'page')
        .single();

      if (pageError) throw pageError;
      if (!originalPage) return { data: null, error: 'Original page not found' };

      // Create new page with "Copy of" prefix
      const { data: newPage, error: newPageError } = await supabase
        .from('blocks')
        .insert({
            workspace_id: originalPage.workspace_id,
            parent_id: originalPage.parent_id,
            properties: { ...originalPage.properties, title: `Copy of ${originalPage.properties?.title || 'Untitled'}`},
            content: originalPage.content,
            type: 'page',
            created_by: userId,
            last_edited_by: userId,
            pos: originalPage.pos + 1,
            archived: false,
            in_trash: false
          })
        .select()
        .single();

      if (newPageError) throw newPageError;

      // Fetch and duplicate direct child blocks
      const { data: originalBlocks, error: blocksError } = await supabase
        .from('blocks')
        .select('*')
        .eq('parent_id', originalPageId)
        .order('pos', { ascending: true });

      if (blocksError) throw blocksError;

      if (originalBlocks && originalBlocks.length > 0) {
        // This simplified logic duplicates direct children.
        // A more robust implementation would handle deep nesting recursively.
        const blocksToInsert = originalBlocks.map((block: Block) => {
          let clonedContent = block.content;
          try {
            clonedContent = block.content || blockCreationService.getInitialContent(block.type);
          } catch (error) {
            console.warn(`Failed to get initial content for block type ${block.type}:`, error);
            clonedContent = {};
          }
          
          return {
            parent_id: newPage.id, // Re-parent to the new page
            type: block.type,
            content: clonedContent,
            properties: block.properties,
            pos: block.pos,
            created_by: userId,
            last_edited_by: userId,
            workspace_id: block.workspace_id,
          };
        });

        await supabase.from('blocks').insert(blocksToInsert as any);
      }

      return { data: newPage, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to duplicate page' 
      };
    }
  }
}
