
import { useState, useEffect, useCallback, useRef } from 'react';
import { PageService } from '@/services/pageService';

interface UseLazyPropertiesProps {
  pageIds: string[];
  fields: Array<{ id: string; type: string }>;
  enabled?: boolean;
}

export function useLazyProperties({ pageIds, fields, enabled = true }: UseLazyPropertiesProps) {
  const [loadedProperties, setLoadedProperties] = useState<Record<string, Record<string, string>>>({});
  const [loadingProperties, setLoadingProperties] = useState<Set<string>>(new Set());
  const [propertyLoadTimes, setPropertyLoadTimes] = useState<Record<string, number>>({});

  // Track which pages we've already started loading to prevent duplicates
  const loadingTracker = useRef<Set<string>>(new Set());
  
  // Stable references to prevent infinite loops
  const enabledRef = useRef(enabled);
  const fieldsRef = useRef(fields);
  
  // Update refs only when values actually change
  enabledRef.current = enabled;
  if (JSON.stringify(fieldsRef.current) !== JSON.stringify(fields)) {
    fieldsRef.current = fields;
  }

  const loadPropertiesForPage = useCallback(async (pageId: string) => {
    console.log('useLazyProperties: loadPropertiesForPage called', { pageId, enabled: enabledRef.current });
    
    if (!enabledRef.current) {
      console.log('useLazyProperties: Skipping load - disabled');
      return;
    }

    // Check if already loaded or currently loading
    if (loadedProperties[pageId] || loadingTracker.current.has(pageId)) {
      console.log('useLazyProperties: Skipping load - already loaded or loading');
      return;
    }

    // Mark as loading
    loadingTracker.current.add(pageId);
    setLoadingProperties(prev => new Set(prev).add(pageId));

    const startTime = performance.now();
    
    try {
      const { data, error } = await PageService.getPageProperties(pageId);
      
      if (!error && data) {
        const properties: Record<string, string> = {};
        data.forEach((prop: any) => {
          properties[prop.field_id] = prop.value || '';
        });

        console.log('useLazyProperties: Properties loaded successfully', { pageId, propertyCount: Object.keys(properties).length });

        // Update loaded properties
        setLoadedProperties(prev => ({
          ...prev,
          [pageId]: properties
        }));

        // Record load time
        const loadTime = performance.now() - startTime;
        setPropertyLoadTimes(prev => ({
          ...prev,
          [pageId]: loadTime
        }));
      } else {
        console.error('useLazyProperties: Error loading properties', { pageId, error });
      }
    } catch (err) {
      console.error('useLazyProperties: Exception loading properties', { pageId, error: err });
    } finally {
      // Clean up loading state
      loadingTracker.current.delete(pageId);
      setLoadingProperties(prev => {
        const newSet = new Set(prev);
        newSet.delete(pageId);
        return newSet;
      });
    }
  }, [loadedProperties]);

  const loadPropertiesForPages = useCallback(async (pageIds: string[]) => {
    console.log('useLazyProperties: loadPropertiesForPages called', { pageCount: pageIds.length });
    
    // Load properties sequentially to avoid race conditions
    for (const pageId of pageIds) {
      await loadPropertiesForPage(pageId);
    }
  }, [loadPropertiesForPage]);

  const getPropertiesForPage = useCallback((pageId: string) => {
    const properties = loadedProperties[pageId] || {};
    console.log('useLazyProperties: getPropertiesForPage', { pageId, propertyCount: Object.keys(properties).length });
    return properties;
  }, [loadedProperties]);

  const isPageLoading = useCallback((pageId: string) => {
    return loadingProperties.has(pageId);
  }, [loadingProperties]);

  return {
    loadedProperties,
    loadPropertiesForPage,
    loadPropertiesForPages,
    getPropertiesForPage,
    isPageLoading,
    propertyLoadTimes
  };
}
