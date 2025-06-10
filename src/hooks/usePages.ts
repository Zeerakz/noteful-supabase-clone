
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
    deletePage,
  };
}
