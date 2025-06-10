
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
  const subscriptionAttemptRef = useRef<number>(0);

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
      // Don't refresh pages list - realtime will handle the update
    }
    
    return { data, error };
  };

  const updatePage = async (id: string, updates: Partial<Pick<Page, 'title' | 'parent_page_id' | 'order_index'>>) => {
    const { data, error } = await PageService.updatePage(id, updates);
    
    if (!error) {
      // Don't refresh pages list - realtime will handle the update
    }
    
    return { data, error };
  };

  const updatePageHierarchy = async (pageId: string, newParentId: string | null, newIndex: number) => {
    if (!workspaceId) return { error: 'Workspace not selected' };

    const { error } = await updateHierarchy(workspaceId, pages, pageId, newParentId, newIndex);
    
    if (!error) {
      // Don't refresh pages list - realtime will handle the update
    }
    
    return { error };
  };

  const deletePage = async (id: string) => {
    const { error } = await PageService.deletePage(id);
    
    if (!error) {
      // Don't refresh pages list - realtime will handle the update
    }
    
    return { error };
  };

  useEffect(() => {
    if (!user || !workspaceId) {
      // Clean up existing channel
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.warn('Error removing pages channel:', error);
        }
        channelRef.current = null;
      }
      return;
    }

    fetchPages();

    // Increment attempt counter to ensure unique channel names
    subscriptionAttemptRef.current += 1;
    const attemptId = subscriptionAttemptRef.current;

    // Set up realtime subscription for pages in this workspace
    const channelName = `pages_${workspaceId}_${attemptId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pages',
          filter: `workspace_id=eq.${workspaceId}`
        },
        (payload) => {
          console.log('Realtime pages update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newPage = payload.new as Page;
            setPages(prev => {
              // Don't add if it's already in the list
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

    // Subscribe only once
    channel.subscribe((status) => {
      console.log('Pages subscription status:', status);
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.warn('Error removing pages channel:', error);
        }
        channelRef.current = null;
      }
    };
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
