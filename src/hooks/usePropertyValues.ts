
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyValue } from '@/types/database';
import { PropertyValueService } from '@/services/propertyValueService';
import { useStableSubscription } from '@/hooks/useStableSubscription';

export function usePropertyValues(pageId?: string) {
  const [properties, setProperties] = useState<PropertyValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const mountedRef = useRef(true);

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

  // Handle realtime updates
  const handleRealtimeUpdate = (payload: any) => {
    if (!mountedRef.current) return;
    
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
  };

  // Set up realtime subscription
  const subscriptionConfig = pageId ? {
    table: 'property_values',
    filter: `page_id=eq.${pageId}`,
  } : null;

  useStableSubscription(subscriptionConfig, handleRealtimeUpdate, [pageId]);

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

  useEffect(() => {
    mountedRef.current = true;
    
    if (!pageId) {
      setProperties([]);
      setLoading(false);
      return;
    }

    fetchProperties();

    return () => {
      mountedRef.current = false;
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
