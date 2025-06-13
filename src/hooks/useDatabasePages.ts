
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Page } from '@/types/page';
import { PageService } from '@/services/pageService';
import { supabase } from '@/integrations/supabase/client';

export function useDatabasePages(databaseId: string, workspaceId: string) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const fetchPages = async () => {
    if (!user || !databaseId) return;

    try {
      setLoading(true);
      const { data, error } = await PageService.fetchDatabasePages(databaseId);

      if (error) throw new Error(error);
      if (mountedRef.current) {
        setPages(data || []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch database pages');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const createDatabasePage = async (title: string) => {
    if (!user || !databaseId || !workspaceId) {
      return { error: 'User not authenticated or required IDs missing' };
    }

    const { data, error } = await PageService.createPage(
      workspaceId, 
      user.id, 
      { title, databaseId }
    );
    
    return { data, error };
  };

  const updatePage = async (pageId: string, updates: Partial<Pick<Page, 'title'>>) => {
    const { data, error } = await PageService.updatePage(pageId, updates);
    return { data, error };
  };

  const deletePage = async (pageId: string) => {
    const { error } = await PageService.deletePage(pageId);
    return { error };
  };

  const cleanup = () => {
    if (channelRef.current) {
      try {
        console.log('Cleaning up database pages channel subscription');
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('Error removing database pages channel:', error);
      }
      channelRef.current = null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    if (!user || !databaseId) {
      cleanup();
      setPages([]);
      setLoading(false);
      return;
    }

    fetchPages();

    // Cleanup existing subscription
    cleanup();

    // Create a unique channel name
    const timestamp = Date.now();
    const channelName = `database_pages_${databaseId}_${user.id}_${timestamp}`;
    console.log('Creating database pages channel:', channelName);
    
    const channel = supabase.channel(channelName);

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pages',
        filter: `database_id=eq.${databaseId}`
      },
      (payload) => {
        if (!mountedRef.current) return;
        
        console.log('Realtime database pages update:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newPage = payload.new as Page;
          setPages(prev => {
            if (prev.some(page => page.id === newPage.id)) {
              return prev;
            }
            return [newPage, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedPage = payload.new as Page;
          setPages(prev => prev.map(page => 
            page.id === updatedPage.id ? updatedPage : page
          ));
        } else if (payload.eventType === 'DELETE') {
          const deletedPage = payload.old as Page;
          setPages(prev => prev.filter(page => page.id !== deletedPage.id));
        }
      }
    );

    // Subscribe and track status
    channel.subscribe((status) => {
      console.log('Database pages subscription status:', status);
    });

    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [user?.id, databaseId]);

  return {
    pages,
    loading,
    error,
    fetchPages,
    createDatabasePage,
    updatePage,
    deletePage,
  };
}
