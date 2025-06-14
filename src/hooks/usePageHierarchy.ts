import { supabase } from '@/integrations/supabase/client';
import { Block } from '@/types/block';

export function usePageHierarchy() {
  const updatePageHierarchy = async (
    workspaceId: string,
    pages: Block[],
    pageId: string, 
    newParentId: string | null, 
    newIndex: number
  ): Promise<{ error: string | null }> => {
    try {
      // First, get all pages that need to be reordered in the target parent
      let siblingPages: Block[];
      if (newParentId === null) {
          const { data: topLevelPages, error } = await supabase
            .from('blocks')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('type', 'page')
            .is('parent_id', null)
            .order('pos', { ascending: true });
          if(error) throw error;
          siblingPages = topLevelPages as Block[];
      } else {
        const { data: childPages, error } = await supabase
            .from('blocks')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('type', 'page')
            .eq('parent_id', newParentId)
            .order('pos', { ascending: true });
        if(error) throw error;
        siblingPages = childPages as Block[];
      }

      if (!siblingPages) throw new Error('Failed to fetch sibling pages');

      // Get the page being moved
      const movingPage = pages.find(p => p.id === pageId);
      if (!movingPage) throw new Error('Page not found');

      const filteredPages = siblingPages.filter(p => p.id !== pageId);
      
      // Create a properly typed copy of the moving page for ordering
      const movingPageForOrdering: Block = {
        ...movingPage,
        parent_id: newParentId,
      };
      
      // Insert the moving page at the new position
      filteredPages.splice(newIndex, 0, movingPageForOrdering);

      // Update the moving page's parent first
      if (movingPage.parent_id !== newParentId) {
        const { error: parentUpdateError } = await supabase
          .from('blocks')
          .update({ 
            parent_id: newParentId,
            last_edited_time: new Date().toISOString()
          })
          .eq('id', pageId);

        if (parentUpdateError) throw parentUpdateError;
      }

      // Update order indices for all affected pages
      const updates = filteredPages.map((page, index) => {
        if (page.pos !== index || page.id === pageId) { // Force update for the moved page
          return supabase
            .from('blocks')
            .update({ 
              pos: index,
              parent_id: page.id === pageId ? newParentId : page.parent_id,
              last_edited_time: new Date().toISOString()
            })
            .eq('id', page.id);
        }
        return null;
      }).filter(Boolean);

      if (updates.length > 0) {
        const results = await Promise.all(updates);
        const firstError = results.find(r => r.error);
        if (firstError) throw firstError.error;
      }
      
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to update page hierarchy' 
      };
    }
  };

  return { updatePageHierarchy };
}
