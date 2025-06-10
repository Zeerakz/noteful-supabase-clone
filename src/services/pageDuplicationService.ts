
import { supabase } from '@/integrations/supabase/client';
import { Page } from '@/types/page';
import { Block } from '@/hooks/useBlocks';
import { PageProperty } from '@/types/database';

export class PageDuplicationService {
  static async duplicatePage(
    originalPageId: string,
    userId: string
  ): Promise<{ data: Page | null; error: string | null }> {
    try {
      // Fetch the original page
      const { data: originalPage, error: pageError } = await supabase
        .from('pages')
        .select('*')
        .eq('id', originalPageId)
        .single();

      if (pageError) throw pageError;

      // Create new page with "Copy of" prefix
      const { data: newPage, error: newPageError } = await supabase
        .from('pages')
        .insert([
          {
            workspace_id: originalPage.workspace_id,
            parent_page_id: originalPage.parent_page_id,
            title: `Copy of ${originalPage.title}`,
            created_by: userId,
            order_index: originalPage.order_index + 1,
          },
        ])
        .select()
        .single();

      if (newPageError) throw newPageError;

      // Fetch and duplicate blocks
      const { data: originalBlocks, error: blocksError } = await supabase
        .from('blocks')
        .select('*')
        .eq('page_id', originalPageId)
        .order('pos', { ascending: true });

      if (blocksError) throw blocksError;

      if (originalBlocks && originalBlocks.length > 0) {
        // Create a mapping of old block IDs to new block IDs for parent relationships
        const blockIdMapping: Record<string, string> = {};

        // First pass: create all blocks without parent relationships
        const blocksToInsert = originalBlocks.map((block: Block) => {
          const newBlockId = crypto.randomUUID();
          blockIdMapping[block.id] = newBlockId;
          
          return {
            id: newBlockId,
            page_id: newPage.id,
            parent_block_id: null, // We'll update this in the second pass
            type: block.type,
            content: block.content,
            pos: block.pos,
            created_by: userId,
          };
        });

        const { error: insertBlocksError } = await supabase
          .from('blocks')
          .insert(blocksToInsert);

        if (insertBlocksError) throw insertBlocksError;

        // Second pass: update parent relationships
        for (const originalBlock of originalBlocks) {
          if (originalBlock.parent_block_id) {
            const newBlockId = blockIdMapping[originalBlock.id];
            const newParentId = blockIdMapping[originalBlock.parent_block_id];
            
            if (newBlockId && newParentId) {
              const { error: updateError } = await supabase
                .from('blocks')
                .update({ parent_block_id: newParentId })
                .eq('id', newBlockId);

              if (updateError) throw updateError;
            }
          }
        }
      }

      // Fetch and duplicate page properties
      const { data: originalProperties, error: propertiesError } = await supabase
        .from('page_properties')
        .select('*')
        .eq('page_id', originalPageId);

      if (propertiesError) throw propertiesError;

      if (originalProperties && originalProperties.length > 0) {
        const propertiesToInsert = originalProperties.map((property: PageProperty) => ({
          page_id: newPage.id,
          field_id: property.field_id,
          value: property.value,
          created_by: userId,
        }));

        const { error: insertPropertiesError } = await supabase
          .from('page_properties')
          .insert(propertiesToInsert);

        if (insertPropertiesError) throw insertPropertiesError;
      }

      return { data: newPage as Page, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to duplicate page' 
      };
    }
  }
}
