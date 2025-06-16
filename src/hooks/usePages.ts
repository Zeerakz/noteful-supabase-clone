
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Block } from '@/types/block';
import { fetchPages as fetchPagesService } from '@/services/pageQueryService';
import { 
  createPage as createPageService, 
  updatePage as updatePageService, 
  deletePage as deletePageService, 
  PageCreateRequest 
} from '@/services/pageMutationService';
import { usePageHierarchy } from '@/hooks/usePageHierarchy';
import { useStableSubscription } from '@/hooks/useStableSubscription';

export function usePages(workspaceId?: string) {
  const [pages, setPages] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { updatePageHierarchy: updateHierarchy } = usePageHierarchy();
  const mountedRef = useRef(true);

  const fetchPages = async () => {
    if (!user || !workspaceId) return;

    try {
      setLoading(true);
      const { data, error } = await fetchPagesService(workspaceId);

      if (error) throw new Error(error);
      if (mountedRef.current) {
        setPages(data || []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pages');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Handle realtime updates
  const handleRealtimeUpdate = (payload: any) => {
    if (!mountedRef.current) return;
    
    console.log('Realtime pages update:', payload);
    
    if (payload.eventType === 'INSERT') {
      const newPage = payload.new as Block;
      if (newPage.type === 'page') {
        setPages(prev => {
          if (prev.some(page => page.id === newPage.id)) {
            return prev;
          }
          return [...prev, newPage].sort((a, b) => a.pos - b.pos);
        });
      }
    } else if (payload.eventType === 'UPDATE') {
      const updatedPage = payload.new as Block;
      if (updatedPage.type === 'page') {
        setPages(prev => prev.map(page => 
          page.id === updatedPage.id ? updatedPage : page
        ).sort((a, b) => a.pos - b.pos));
      }
    } else if (payload.eventType === 'DELETE') {
      const deletedPage = payload.old as Block;
      if (deletedPage.type === 'page') {
        setPages(prev => prev.filter(page => page.id !== deletedPage.id));
      }
    }
  };

  // Set up realtime subscription
  const subscriptionConfig = workspaceId ? {
    table: 'blocks',
    filter: `workspace_id=eq.${workspaceId}`,
  } : null;

  useStableSubscription(subscriptionConfig, handleRealtimeUpdate, [workspaceId]);

  const createPage = async (title: string, parentId?: string, databaseId?: string) => {
    if (!user || !workspaceId) return { error: 'User not authenticated or workspace not selected' };

    const properties: { title: string; database_id?: string; } = { title };
    if (databaseId) {
      properties.database_id = databaseId;
    }

    const pageDetails: PageCreateRequest = {
      properties,
      parent_id: parentId,
    };

    const { data, error } = await createPageService(
      workspaceId,
      user.id,
      pageDetails
    );
    
    return { data, error };
  };

  const updatePage = async (id: string, updates: Partial<Block>) => {
    const { data, error } = await updatePageService(id, updates);
    return { data, error };
  };

  const updatePageHierarchy = async (pageId: string, newParentId: string | null, newIndex: number) => {
    if (!workspaceId) return { error: 'Workspace not selected' };

    const { error } = await updateHierarchy(workspaceId, pages, pageId, newParentId, newIndex);
    return { error };
  };

  const deletePage = async (id: string) => {
    const { error } = await deletePageService(id);
    return { error };
  };

  useEffect(() => {
    mountedRef.current = true;

    if (!user || !workspaceId) {
      setPages([]);
      setLoading(false);
      return;
    }

    fetchPages();

    return () => {
      mountedRef.current = false;
    };
  }, [user?.id, workspaceId]);

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
export type { Block } from '@/types/block';
