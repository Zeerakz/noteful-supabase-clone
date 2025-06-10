
import { supabase } from '@/integrations/supabase/client';
import { Page } from '@/types/page';

export function usePageHierarchy() {
  const updatePageHierarchy = async (
    workspaceId: string,
    pages: Page[],
    pageId: string, 
    newParentId: string | null, 
    newIndex: number
  ): Promise<{ error: string | null }> => {
    try {
      // First, get all pages that need to be reordered in the target parent
      const { data: siblingPages } = await supabase
        .from('pages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('parent_page_id', newParentId || null)
        .order('order_index', { ascending: true });

      if (!siblingPages) throw new Error('Failed to fetch sibling pages');

      // Get the page being moved
      const movingPage = pages.find(p => p.id === pageId);
      if (!movingPage) throw new Error('Page not found');

      // Remove the page being moved from its current position in siblings
      const filteredPages = siblingPages.filter(p => p.id !== pageId);
      
      // Create a properly typed copy of the moving page for ordering
      const movingPageForOrdering = {
        ...movingPage,
        parent_page_id: newParentId || undefined,
        // Ensure all required fields are present with correct types
        id: movingPage.id,
        workspace_id: movingPage.workspace_id,
        title: movingPage.title,
        created_by: movingPage.created_by,
        order_index: movingPage.order_index,
        created_at: movingPage.created_at,
        updated_at: movingPage.updated_at
      };
      
      // Insert the moving page at the new position
      filteredPages.splice(newIndex, 0, movingPageForOrdering);

      // Update the moving page's parent first
      if (movingPage.parent_page_id !== newParentId) {
        const { error: parentUpdateError } = await supabase
          .from('pages')
          .update({ 
            parent_page_id: newParentId,
            updated_at: new Date().toISOString()
          })
          .eq('id', pageId);

        if (parentUpdateError) throw parentUpdateError;
      }

      // Update order indices for all affected pages
      for (let i = 0; i < filteredPages.length; i++) {
        const page = filteredPages[i];
        if (page.order_index !== i) {
          const { error } = await supabase
            .from('pages')
            .update({ 
              order_index: i,
              updated_at: new Date().toISOString()
            })
            .eq('id', page.id);

          if (error) throw error;
        }
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
