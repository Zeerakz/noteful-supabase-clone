
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Page } from '@/types/page';
import { errorHandler } from '@/utils/errorHandler';

interface PageData extends Page {
  workspace: {
    id: string;
    name: string;
  };
}

interface UsePageDataResult {
  pageData: PageData | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function usePageData(pageId?: string): UsePageDataResult {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const fetchPageData = async (signal?: AbortSignal) => {
    if (!pageId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📄 Fetching page data for:', pageId);
      
      const { data, error: fetchError } = await supabase
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

      if (signal?.aborted) return;

      if (fetchError) {
        console.error('❌ Error fetching page:', fetchError);
        errorHandler.logError(fetchError as Error, { context: 'page_data_fetch', pageId });
        throw new Error('Failed to load page');
      }

      if (!data) {
        throw new Error('Page not found');
      }

      if (mountedRef.current) {
        console.log('✅ Page data loaded successfully:', data.title);
        setPageData({
          ...data,
          workspace: data.workspaces
        });
      }
    } catch (err) {
      if (signal?.aborted) return;
      
      console.error('💥 Page data fetch failed:', err);
      errorHandler.logError(err as Error, { context: 'page_data_fetch_critical', pageId });
      
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load page');
      }
    } finally {
      if (mountedRef.current && !signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const retry = () => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Start new request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    fetchPageData(controller.signal);
  };

  useEffect(() => {
    mountedRef.current = true;
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Start new request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    fetchPageData(controller.signal);

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [pageId]);

  return {
    pageData,
    loading,
    error,
    retry
  };
}
