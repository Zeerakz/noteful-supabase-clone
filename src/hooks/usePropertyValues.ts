
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyValue } from '@/types/database';
import { PropertyValueService } from '@/services/propertyValueService';
import { supabase } from '@/integrations/supabase/client';

export function usePropertyValues(pageId?: string) {
  const [properties, setProperties] = useState<PropertyValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef<boolean>(false);

  const fetchProperties = async () => {
    if (!pageId) {
      setProperties([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await PropertyValueService.fetchPropertyValues(pageId);

      if (error) throw new Error(error);
      setProperties(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch page properties');
    } finally {
      setLoading(false);
    }
  };

  const updateProperty = async (propertyId: string, value: string) => {
    if (!user || !pageId) return { error: 'User not authenticated or page not selected' };

    const { data, error } = await PropertyValueService.upsertPropertyValue(
      pageId, 
      propertyId, 
      value, 
      user.id
    );
    
    return { data, error };
  };

  const deleteProperty = async (propertyId: string) => {
    if (!pageId) return { error: 'Page not selected' };

    const { error } = await PropertyValueService.deletePropertyValue(pageId, propertyId);
    return { error };
  };

  const deleteAllProperties = async () => {
    if (!pageId) return { error: 'Page not selected' };

    const { error } = await PropertyValueService.deleteAllPropertyValues(pageId);
    return { error };
  };

  const cleanup = () => {
    if (channelRef.current && isSubscribedRef.current) {
      try {
        console.log('Cleaning up page properties channel subscription');
        supabase.removeChannel(channelRef.current);
        isSubscribedRef.current = false;
      } catch (error) {
        console.warn('Error removing page properties channel:', error);
      }
      channelRef.current = null;
    }
  };

  useEffect(() => {
    if (!pageId) {
      cleanup();
      setProperties([]);
      setLoading(false);
      return;
    }

    fetchProperties();

    // Cleanup existing subscription
    cleanup();

    // Create unique channel name to avoid conflicts
    const timestamp = Date.now();
    const channelName = `property_values_${pageId}_${timestamp}`;
    console.log('Creating page properties channel:', channelName);

    // Set up realtime subscription for page properties
    const channel = supabase.channel(channelName);
    
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'property_values',
        filter: `page_id=eq.${pageId}`
      },
      (payload) => {
        console.log('Realtime page properties update:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newProperty = payload.new as PropertyValue;
          setProperties(prev => {
            if (prev.some(prop => prop.id === newProperty.id)) {
              return prev;
            }
            return [...prev, newProperty];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedProperty = payload.new as PropertyValue;
          setProperties(prev => prev.map(prop => 
            prop.id === updatedProperty.id ? updatedProperty : prop
          ));
        } else if (payload.eventType === 'DELETE') {
          const deletedProperty = payload.old as PropertyValue;
          setProperties(prev => prev.filter(prop => prop.id !== deletedProperty.id));
        }
      }
    );

    // Subscribe only once and track status
    channel.subscribe((status) => {
      console.log('Page properties subscription status:', status);
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        isSubscribedRef.current = false;
      }
    });

    channelRef.current = channel;

    return cleanup;
  }, [pageId]);

  return {
    properties,
    loading,
    error,
    fetchProperties,
    updateProperty,
    deleteProperty,
    deleteAllProperties,
  };
}
