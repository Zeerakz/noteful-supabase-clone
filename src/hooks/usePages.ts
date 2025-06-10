
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Page } from '@/types/page';
import { PageService } from '@/services/pageService';
import { usePageHierarchy } from '@/hooks/usePageHierarchy';

export function usePages(workspaceId?: string) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { updatePageHierarchy: updateHierarchy } = usePageHierarchy();

  const fetchPages = async () => {
    if (!user || !workspaceId) return;

    try {
      setLoading(true);
      const { data, error } = await PageService.fetchPages(workspaceId);

      if (error) throw new Error(error);
      setPages(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  };

  const createPage = async (title: string, parentPageId?: string) => {
    if (!user || !workspaceId) return { error: 'User not authenticated or workspace not selected' };

    const { data, error } = await PageService.createPage(
      workspaceId, 
      user.id, 
      { title, parentPageId }
    );
    
    if (!error) {
      // Refresh pages list
      await fetchPages();
    }
    
    return { data, error };
  };

  const updatePage = async (id: string, updates: Partial<Pick<Page, 'title' | 'parent_page_id' | 'order_index'>>) => {
    const { data, error } = await PageService.updatePage(id, updates);
    
    if (!error) {
      // Refresh pages list
      await fetchPages();
    }
    
    return { data, error };
  };

  const updatePageHierarchy = async (pageId: string, newParentId: string | null, newIndex: number) => {
    if (!workspaceId) return { error: 'Workspace not selected' };

    const { error } = await updateHierarchy(workspaceId, pages, pageId, newParentId, newIndex);
    
    if (!error) {
      // Refresh pages list
      await fetchPages();
    }
    
    return { error };
  };

  const deletePage = async (id: string) => {
    const { error } = await PageService.deletePage(id);
    
    if (!error) {
      // Refresh pages list
      await fetchPages();
    }
    
    return { error };
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

// Re-export the Page type for backward compatibility
export type { Page } from '@/types/page';
