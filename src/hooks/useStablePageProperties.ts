
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageProperty } from '@/types/database';
import { errorHandler } from '@/utils/errorHandler';

interface UseStablePagePropertiesResult {
  properties: PageProperty[];
  loading: boolean;
  error: string | null;
  updateProperty: (fieldId: string, value: string) => Promise<{ error?: string }>;
  retry: () => void;
}

export function useStablePageProperties(pageId?: string): UseStablePagePropertiesResult {
  const [properties, setProperties] = useState<PageProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const lastPageIdRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      try {
        console.log('🧹 Cleaning up page properties subscription');
        supabase.removeChannel(channelRef.current);
      } catch (err) {
        console.warn('Warning during subscription cleanup:', err);
      }
      channelRef.current = null;
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    if (!pageId || !mountedRef.current) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching properties for page:', pageId);
      
      const { data, error: fetchError } = await supabase
        .from('page_properties')
        .select('*')
        .eq('page_id', pageId);

      if (!mountedRef.current) return;

      if (fetchError) {
        console.error('❌ Error fetching properties:', fetchError);
        throw new Error('Failed to load properties');
      }

      console.log('✅ Properties loaded:', data?.length || 0);
      setProperties(data || []);
    } catch (err) {
      console.error('💥 Properties fetch failed:', err);
      errorHandler.logError(err as Error, { context: 'page_properties_fetch', pageId });
      
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load properties');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [pageId]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!pageId || channelRef.current) return;

    try {
      const channelName = `page_properties_${pageId}_${Date.now()}`;
      console.log('📡 Setting up properties subscription:', channelName);
      
      const channel = supabase.channel(channelName);
      
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_properties',
          filter: `page_id=eq.${pageId}`
        },
        (payload) => {
          if (!mountedRef.current) return;
          
          console.log('📨 Properties update:', payload.eventType);
          
          setProperties(prev => {
            switch (payload.eventType) {
              case 'INSERT':
                const newProperty = payload.new as PageProperty;
                if (prev.some(p => p.id === newProperty.id)) return prev;
                return [...prev, newProperty];
              
              case 'UPDATE':
                const updatedProperty = payload.new as PageProperty;
                return prev.map(p => p.id === updatedProperty.id ? updatedProperty : p);
              
              case 'DELETE':
                const deletedProperty = payload.old as PageProperty;
                return prev.filter(p => p.id !== deletedProperty.id);
              
              default:
                return prev;
            }
          });
        }
      );

      channel.subscribe((status) => {
        console.log('📡 Properties subscription status:', status);
      });

      channelRef.current = channel;
    } catch (err) {
      console.error('❌ Failed to setup properties subscription:', err);
    }
  }, [pageId]);

  const updateProperty = useCallback(async (fieldId: string, value: string) => {
    if (!pageId) return { error: 'No page selected' };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'User not authenticated' };

      const { error } = await supabase
        .from('page_properties')
        .upsert({
          page_id: pageId,
          field_id: fieldId,
          value: value,
          updated_by: user.id
        });

      if (error) throw error;
      return {};
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update property';
      errorHandler.logError(err as Error, { context: 'property_update', pageId, fieldId });
      return { error: errorMessage };
    }
  }, [pageId]);

  const retry = useCallback(() => {
    cleanup();
    fetchProperties();
    setupRealtimeSubscription();
  }, [cleanup, fetchProperties, setupRealtimeSubscription]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Only fetch if pageId changed
    if (pageId !== lastPageIdRef.current) {
      cleanup();
      lastPageIdRef.current = pageId;
      
      if (pageId) {
        fetchProperties();
        setupRealtimeSubscription();
      } else {
        setProperties([]);
        setLoading(false);
      }
    }

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [pageId, cleanup, fetchProperties, setupRealtimeSubscription]);

  return {
    properties,
    loading,
    error,
    updateProperty,
    retry
  };
}
