
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Block } from '@/types/block';
import { errorHandler } from '@/utils/errorHandler';

interface PageWithWorkspace extends Block {
  workspace: {
    id: string;
    name: string;
  };
}

export function usePageWithWorkspace(pageId?: string, workspacesLoading?: boolean) {
  const [pageWithWorkspace, setPageWithWorkspace] = useState<PageWithWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedPageIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchPageWithWorkspace = async () => {
      if (!pageId || workspacesLoading || !mountedRef.current) {
        setLoading(false);
        return;
      }
      
      // Prevent duplicate fetches
      if (fetchedPageIdRef.current === pageId) return;
      

      try {
        setLoading(true);
        setError(null);
        fetchedPageIdRef.current = pageId;
        
        console.log('📄 Fetching page with workspace for pageId:', pageId);
        
        const { data: pageData, error } = await supabase
          .from('blocks')
          .select(`
            *,
            workspace:workspaces!inner (
              id,
              name
            )
          `)
          .eq('id', pageId)
          .single();

        if (!mountedRef.current) return;

        if (error) {
          console.error('❌ Error fetching page:', error);
          errorHandler.logError(error as Error, { context: 'page_fetch', pageId });
          setError('Failed to fetch page');
          setPageWithWorkspace(null);
        } else if (pageData) {
          const properties = pageData.properties as { title?: string };
          console.log('✅ Page fetched successfully:', properties?.title);
          setPageWithWorkspace(pageData as PageWithWorkspace);
        }
      } catch (err) {
        console.error('💥 Error fetching page with workspace:', err);
        errorHandler.logError(err as Error, { context: 'page_fetch_critical', pageId });
        if (mountedRef.current) {
          setError('Failed to fetch page');
          setPageWithWorkspace(null);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchPageWithWorkspace();
  }, [pageId, workspacesLoading]);

  return {
    pageWithWorkspace,
    loading,
    error
  };
}
