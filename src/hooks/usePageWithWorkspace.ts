
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Page } from '@/types/page';
import { errorHandler } from '@/utils/errorHandler';

interface PageWithWorkspace extends Page {
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
      fetchedPageIdRef.current = pageId;

      try {
        setLoading(true);
        setError(null);
        
        console.log('📄 Fetching page with workspace for pageId:', pageId);
        
        const { data: pageData, error } = await supabase
          .from('pages')
          .select(`
            *,
            workspaces!inner (
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
          console.log('✅ Page fetched successfully:', pageData.title);
          setPageWithWorkspace({
            ...pageData,
            workspace: pageData.workspaces
          });
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
