
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
import { supabase } from '@/integrations/supabase/client';

export function usePages(workspaceId?: string) {
  const [pages, setPages] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { updatePageHierarchy: updateHierarchy } = usePageHierarchy();
  const channelRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const subscriptionActiveRef = useRef(false);

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

  const cleanup = () => {
    if (channelRef.current && subscriptionActiveRef.current) {
      try {
        console.log('Cleaning up pages channel subscription');
        channelRef.current.unsubscribe();
        // Remove the channel from Supabase client
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('Error cleaning up pages channel:', error);
      }
      channelRef.current = null;
      subscriptionActiveRef.current = false;
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

    // Cleanup existing subscription before creating new one
    cleanup();

    // Create a unique channel name to avoid conflicts
    const channelName = `pages_${workspaceId}_${user.id}_${Date.now()}`;
    console.log('Creating pages channel:', channelName);
    
    try {
      const channel = supabase.channel(channelName);

      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocks',
          filter: `workspace_id=eq.${workspaceId}`
        },
        (payload) => {
          if (!mountedRef.current) return;
          
          console.log('Realtime pages update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newPage = payload.new as Block;
            if (newPage.type === 'page') {
              setPages(prev => {
                // Prevent duplicates
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
        }
      );

      // Subscribe with proper error handling
      channel.subscribe((status, err) => {
        console.log('Pages subscription status:', status);
        if (err) {
          console.error('Pages subscription error:', err);
        } else if (status === 'SUBSCRIBED') {
          subscriptionActiveRef.current = true;
        } else if (status === 'CLOSED') {
          subscriptionActiveRef.current = false;
        }
      });

      channelRef.current = channel;
    } catch (error) {
      console.error('Error setting up pages channel:', error);
    }

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
export type { Block } from '@/types/block';
