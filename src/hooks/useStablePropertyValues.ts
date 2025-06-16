
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PropertyValue } from '@/types/database';
import { errorHandler } from '@/utils/errorHandler';
import { useStableSubscription } from '@/hooks/useStableSubscription';

interface UseStablePropertyValuesResult {
  properties: PropertyValue[];
  loading: boolean;
  error: string | null;
  updateProperty: (propertyId: string, value: string) => Promise<{ error?: string }>;
  retry: () => void;
}

export function useStablePropertyValues(pageId?: string): UseStablePropertyValuesResult {
  const [properties, setProperties] = useState<PropertyValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

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
        .from('property_values')
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

  // Handle realtime updates
  const handleRealtimeUpdate = useCallback((payload: any) => {
    if (!mountedRef.current) return;
    
    console.log('📨 Properties update:', payload.eventType);
    
    setProperties(prev => {
      switch (payload.eventType) {
        case 'INSERT':
          const newProperty = payload.new as PropertyValue;
          if (prev.some(p => p.id === newProperty.id)) return prev;
          return [...prev, newProperty];
        
        case 'UPDATE':
          const updatedProperty = payload.new as PropertyValue;
          return prev.map(p => p.id === updatedProperty.id ? updatedProperty : p);
        
        case 'DELETE':
          const deletedProperty = payload.old as Partial<PropertyValue> & { id: string };
          return prev.filter(p => p.id !== deletedProperty.id);
        
        default:
          return prev;
      }
    });
  }, []);

  // Set up realtime subscription
  const subscriptionConfig = pageId ? {
    table: 'property_values',
    filter: `page_id=eq.${pageId}`,
  } : null;

  useStableSubscription(subscriptionConfig, handleRealtimeUpdate, [pageId]);

  const updateProperty = useCallback(async (propertyId: string, value: string) => {
    if (!pageId) return { error: 'No page selected' };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'User not authenticated' };

      const { error } = await supabase
        .from('property_values')
        .upsert({
          page_id: pageId,
          property_id: propertyId,
          value: value,
          created_by: user.id
        }, { onConflict: 'page_id, property_id' });

      if (error) throw error;
      return {};
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update property';
      errorHandler.logError(err as Error, { context: 'property_update', pageId, propertyId });
      return { error: errorMessage };
    }
  }, [pageId]);

  const retry = useCallback(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (pageId) {
      fetchProperties();
    } else {
      setProperties([]);
      setLoading(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [pageId, fetchProperties]);

  return {
    properties,
    loading,
    error,
    updateProperty,
    retry
  };
}
