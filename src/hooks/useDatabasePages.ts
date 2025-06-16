
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Block } from '@/types/block';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspaceRealtime } from '@/hooks/useWorkspaceRealtime';

const formatPageProperties = (page: any): Block => {
  const properties = (typeof page.properties === 'object' && page.properties !== null && !Array.isArray(page.properties))
    ? page.properties
    : {};
  return { ...page, properties } as Block;
};

export function useDatabasePages(databaseId: string, workspaceId: string) {
  const [pages, setPages] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const mountedRef = useRef(true);

  const fetchPages = async () => {
    if (!user || !databaseId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blocks')
        .select('id, workspace_id, type, parent_id, properties, content, pos, created_time, last_edited_time, created_by, last_edited_by, archived, in_trash')
        .eq('type', 'page')
        .eq('properties->>database_id', databaseId)
        .order('created_time', { ascending: false });

      if (error) throw error;
      if (mountedRef.current) {
        setPages((data || []).map(formatPageProperties));
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

  // Handle realtime updates
  const handlePageChange = (payload: any) => {
    if (!mountedRef.current) return;
    
    console.log('Database pages realtime update:', payload);
    
    if (payload.eventType === 'INSERT') {
      const newPage = formatPageProperties(payload.new);
      if (newPage.properties?.database_id === databaseId) {
        setPages(prev => {
          if (prev.some(page => page.id === newPage.id)) {
            return prev;
          }
          return [newPage, ...prev];
        });
      }
    } else if (payload.eventType === 'UPDATE') {
      const updatedPage = formatPageProperties(payload.new);
      if (updatedPage.properties?.database_id === databaseId) {
        setPages(prev => prev.map(page => 
          page.id === updatedPage.id ? updatedPage : page
        ));
      }
    } else if (payload.eventType === 'DELETE') {
      const deletedPage = payload.old as Partial<Block> & { id: string };
      setPages(prev => prev.filter(page => page.id !== deletedPage.id));
    }
  };

  // Use workspace realtime for this database
  useWorkspaceRealtime({
    workspaceId,
    onPageChange: handlePageChange,
  });

  const createDatabasePage = async (title: string) => {
    if (!user || !databaseId || !workspaceId) {
      return { data: null, error: 'User not authenticated or required IDs missing' };
    }

    const properties = { title, database_id: databaseId };

    const { data, error } = await supabase
      .from('blocks')
      .insert({
        workspace_id: workspaceId,
        created_by: user.id,
        last_edited_by: user.id,
        type: 'page',
        properties,
        pos: 0,
      })
      .select()
      .single();

    return { data: data ? formatPageProperties(data) : null, error: error ? error.message : null };
  };

  const updatePage = async (pageId: string, updates: Partial<{ title: string }>) => {
    let pageToUpdate = pages.find(p => p.id === pageId);

    if (!pageToUpdate) {
        const { data: fetchedPage, error: fetchError } = await supabase
            .from('blocks')
            .select('*')
            .eq('id', pageId)
            .single();

        if(fetchError || !fetchedPage) {
            return { data: null, error: "Page not found to update." };
        }
        pageToUpdate = formatPageProperties(fetchedPage);
    }
    
    const currentProperties = pageToUpdate.properties || {};

    const blockUpdates: Partial<Block> = {};
    if (updates.title !== undefined) {
        blockUpdates.properties = { ...currentProperties, title: updates.title };
    }

    if (Object.keys(blockUpdates).length === 0) {
        return { data: pageToUpdate, error: null };
    }

    const { data, error } = await supabase
        .from('blocks')
        .update(blockUpdates as any)
        .eq('id', pageId)
        .select()
        .single();
        
    return { data: data ? formatPageProperties(data) : null, error: error ? error.message : null };
  };

  const deletePage = async (pageId: string) => {
    const { error } = await supabase.from('blocks').delete().eq('id', pageId);
    return { error: error ? error.message : null };
  };

  useEffect(() => {
    mountedRef.current = true;

    if (!user || !databaseId) {
      setPages([]);
      setLoading(false);
      return;
    }

    fetchPages();

    return () => {
      mountedRef.current = false;
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
