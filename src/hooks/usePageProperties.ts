
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageProperty } from '@/types/database';
import { PagePropertyService } from '@/services/pagePropertyService';

export function usePageProperties(pageId?: string) {
  const [properties, setProperties] = useState<PageProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

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
      // Refresh properties
      await fetchProperties();
    }
    
    return { data, error };
  };

  const deleteProperty = async (fieldId: string) => {
    if (!pageId) return { error: 'Page not selected' };

    const { error } = await PagePropertyService.deletePageProperty(pageId, fieldId);
    
    if (!error) {
      // Refresh properties
      await fetchProperties();
    }
    
    return { error };
  };

  const deleteAllProperties = async () => {
    if (!pageId) return { error: 'Page not selected' };

    const { error } = await PagePropertyService.deleteAllPageProperties(pageId);
    
    if (!error) {
      // Refresh properties
      await fetchProperties();
    }
    
    return { error };
  };

  useEffect(() => {
    fetchProperties();
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
