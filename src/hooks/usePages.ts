
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Page {
  id: string;
  workspace_id: string;
  parent_page_id?: string;
  title: string;
  created_by: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export function usePages(workspaceId?: string) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPages = async () => {
    if (!user || !workspaceId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  };

  const createPage = async (title: string, parentPageId?: string) => {
    if (!user || !workspaceId) return { error: 'User not authenticated or workspace not selected' };

    try {
      // Get the next order index for this parent
      const { data: existingPages } = await supabase
        .from('pages')
        .select('order_index')
        .eq('workspace_id', workspaceId)
        .eq('parent_page_id', parentPageId || null)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingPages && existingPages.length > 0 
        ? existingPages[0].order_index + 1 
        : 0;

      const { data, error } = await supabase
        .from('pages')
        .insert([
          {
            workspace_id: workspaceId,
            parent_page_id: parentPageId || null,
            title,
            created_by: user.id,
            order_index: nextOrderIndex,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh pages list
      await fetchPages();
      
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create page';
      return { data: null, error };
    }
  };

  const updatePage = async (id: string, updates: Partial<Pick<Page, 'title' | 'parent_page_id' | 'order_index'>>) => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh pages list
      await fetchPages();
      
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update page';
      return { data: null, error };
    }
  };

  const updatePageHierarchy = async (pageId: string, newParentId: string | null, newIndex: number) => {
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
      
      // Create a copy of the moving page with the new parent_page_id for ordering
      const movingPageForOrdering: Page = {
        ...movingPage,
        parent_page_id: newParentId || undefined
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
      
      // Refresh pages list
      await fetchPages();
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update page hierarchy';
      return { error };
    }
  };

  const deletePage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh pages list
      await fetchPages();
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete page';
      return { error };
    }
  };

  useEffect(() => {
    fetchPages();
  }, [user, workspaceId]);

  return {
    pages,
    loading,
    error,
    fetchPages,
    createPage,
    updatePage,
    updatePageHierarchy,
    deletePage,
  };
}
