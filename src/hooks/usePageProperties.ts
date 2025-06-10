
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageProperty } from '@/types/database';
import { PagePropertyService } from '@/services/pagePropertyService';
import { supabase } from '@/integrations/supabase/client';

export function usePageProperties(pageId?: string) {
  const [properties, setProperties] = useState<PageProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  const fetchProperties = async () => {
    if (!pageId) {
      setProperties([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await PagePropertyService.fetchPageProperties(pageId);

      if (error) throw new Error(error);
      setProperties(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch page properties');
    } finally {
      setLoading(false);
    }
  };

  const updateProperty = async (fieldId: string, value: string) => {
    if (!user || !pageId) return { error: 'User not authenticated or page not selected' };

    const { data, error } = await PagePropertyService.upsertPageProperty(
      pageId, 
      fieldId, 
      value, 
      user.id
    );
    
    if (!error) {
      // Don't refresh properties - realtime will handle the update
    }
    
    return { data, error };
  };

  const deleteProperty = async (fieldId: string) => {
    if (!pageId) return { error: 'Page not selected' };

    const { error } = await PagePropertyService.deletePageProperty(pageId, fieldId);
    
    if (!error) {
      // Don't refresh properties - realtime will handle the update
    }
    
    return { error };
  };

  const deleteAllProperties = async () => {
    if (!pageId) return { error: 'Page not selected' };

    const { error } = await PagePropertyService.deleteAllPageProperties(pageId);
    
    if (!error) {
      // Don't refresh properties - realtime will handle the update
    }
    
    return { error };
  };

  useEffect(() => {
    if (!pageId) {
      setProperties([]);
      setLoading(false);
      return;
    }

    fetchProperties();

    // Set up realtime subscription for page properties
    const channel = supabase
      .channel(`page-properties-${pageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_properties',
          filter: `page_id=eq.${pageId}`
        },
        (payload) => {
          console.log('Realtime page properties update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newProperty = payload.new as PageProperty;
            setProperties(prev => {
              // Don't add if it's already in the list
              if (prev.some(prop => prop.id === newProperty.id)) {
                return prev;
              }
              return [...prev, newProperty];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedProperty = payload.new as PageProperty;
            setProperties(prev => prev.map(prop => 
              prop.id === updatedProperty.id ? updatedProperty : prop
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedProperty = payload.old as PageProperty;
            setProperties(prev => prev.filter(prop => prop.id !== deletedProperty.id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
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
