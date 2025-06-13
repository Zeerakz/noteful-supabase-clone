
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Page } from '@/types/page';
import { PageService } from '@/services/pageService';
import { usePageHierarchy } from '@/hooks/usePageHierarchy';
import { supabase } from '@/integrations/supabase/client';

export function usePages(workspaceId?: string) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { updatePageHierarchy: updateHierarchy } = usePageHierarchy();
  const channelRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const fetchPages = async () => {
    if (!user || !workspaceId) return;

    try {
      setLoading(true);
      const { data, error } = await PageService.fetchPages(workspaceId);

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

  const createPage = async (title: string, parentPageId?: string) => {
    if (!user || !workspaceId) return { error: 'User not authenticated or workspace not selected' };

    const { data, error } = await PageService.createPage(
      workspaceId, 
      user.id, 
      { title, parentPageId }
    );
    
    return { data, error };
  };

  const updatePage = async (id: string, updates: Partial<Pick<Page, 'title' | 'parent_page_id' | 'order_index'>>) => {
    const { data, error } = await PageService.updatePage(id, updates);
    return { data, error };
  };

  const updatePageHierarchy = async (pageId: string, newParentId: string | null, newIndex: number) => {
    if (!workspaceId) return { error: 'Workspace not selected' };

    const { error } = await updateHierarchy(workspaceId, pages, pageId, newParentId, newIndex);
    return { error };
  };

  const deletePage = async (id: string) => {
    const { error } = await PageService.deletePage(id);
    return { error };
  };

  const cleanup = () => {
    if (channelRef.current) {
      try {
        console.log('Cleaning up pages channel subscription');
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('Error removing pages channel:', error);
      }
      channelRef.current = null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    if (!user || !workspaceId) {
      cleanup();
      setPages([]);
      setLoading(false);
      return;
    }

    fetchPages();

    // Cleanup existing subscription
    cleanup();

    // Create unique channel name
    const timestamp = Date.now();
    const channelName = `pages_${workspaceId}_${user.id}_${timestamp}`;
    console.log('Creating pages channel:', channelName);
    
    const channel = supabase.channel(channelName);

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pages',
        filter: `workspace_id=eq.${workspaceId}`
      },
      (payload) => {
        if (!mountedRef.current) return;
        
        console.log('Realtime pages update:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newPage = payload.new as Page;
          setPages(prev => {
            if (prev.some(page => page.id === newPage.id)) {
              return prev;
            }
            return [...prev, newPage].sort((a, b) => a.order_index - b.order_index);
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedPage = payload.new as Page;
          setPages(prev => prev.map(page => 
            page.id === updatedPage.id ? updatedPage : page
          ).sort((a, b) => a.order_index - b.order_index));
        } else if (payload.eventType === 'DELETE') {
          const deletedPage = payload.old as Page;
          setPages(prev => prev.filter(page => page.id !== deletedPage.id));
        }
      }
    );

    // Subscribe and track status
    channel.subscribe((status) => {
      console.log('Pages subscription status:', status);
    });

    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      cleanup();
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
export type { Page } from '@/types/page';
