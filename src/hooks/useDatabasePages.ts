
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

  const fetchPages = async () => {
    if (!user || !databaseId) return;

    try {
      setLoading(true);
      const { data, error } = await PageService.fetchDatabasePages(databaseId);

      if (error) throw new Error(error);
      setPages(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch database pages');
    } finally {
      setLoading(false);
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
    
    if (!error) {
      // Realtime will handle the update
    }
    
    return { data, error };
  };

  const updatePage = async (pageId: string, updates: Partial<Pick<Page, 'title'>>) => {
    const { data, error } = await PageService.updatePage(pageId, updates);
    
    if (!error) {
      // Realtime will handle the update
    }
    
    return { data, error };
  };

  const deletePage = async (pageId: string) => {
    const { error } = await PageService.deletePage(pageId);
    
    if (!error) {
      // Realtime will handle the update
    }
    
    return { error };
  };

  const cleanup = () => {
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('Error removing database pages channel:', error);
      }
      channelRef.current = null;
    }
  };

  useEffect(() => {
    if (!user || !databaseId) {
      cleanup();
      setPages([]);
      setLoading(false);
      return;
    }

    fetchPages();

    // Cleanup existing subscription
    cleanup();

    // Set up realtime subscription for pages in this database
    const channelName = `database_pages_${databaseId}_${user.id}_${Date.now()}`;
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
        console.log('Realtime database pages update:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newPage = payload.new as Page;
          setPages(prev => {
            if (prev.some(page => page.id === newPage.id)) {
              return prev;
            }
            return [newPage, ...prev]; // Add new pages at the top
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

    channel.subscribe((status) => {
      console.log('Database pages subscription status:', status);
    });

    channelRef.current = channel;

    return cleanup;
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
