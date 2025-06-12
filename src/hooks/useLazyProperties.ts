
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

  // Track which pages we've already loaded to prevent duplicates
  const loadedPagesRef = useRef<Set<string>>(new Set());
  const loadingPagesRef = useRef<Set<string>>(new Set());
  
  // Stable references to prevent infinite loops
  const enabledRef = useRef(enabled);
  const fieldsRef = useRef(fields);
  const pageIdsRef = useRef(pageIds);
  
  // Update refs only when values actually change
  enabledRef.current = enabled;
  
  const fieldsKey = fields.map(f => `${f.id}-${f.type}`).join(',');
  const fieldsKeyRef = useRef(fieldsKey);
  if (fieldsKeyRef.current !== fieldsKey) {
    fieldsRef.current = fields;
    fieldsKeyRef.current = fieldsKey;
  }
  
  const pageIdsKey = pageIds.join(',');
  const pageIdsKeyRef = useRef(pageIdsKey);
  if (pageIdsKeyRef.current !== pageIdsKey) {
    pageIdsRef.current = pageIds;
    pageIdsKeyRef.current = pageIdsKey;
  }

  const loadPropertiesForPage = useCallback(async (pageId: string) => {
    console.log('useLazyProperties: loadPropertiesForPage called', { pageId, enabled: enabledRef.current });
    
    if (!enabledRef.current) {
      console.log('useLazyProperties: Skipping load - disabled');
      return;
    }

    // Check if already loaded or currently loading
    if (loadedPagesRef.current.has(pageId) || loadingPagesRef.current.has(pageId)) {
      console.log('useLazyProperties: Skipping load - already loaded or loading');
      return;
    }

    // Mark as loading
    loadingPagesRef.current.add(pageId);
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

        // Mark as loaded
        loadedPagesRef.current.add(pageId);

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
      loadingPagesRef.current.delete(pageId);
      setLoadingProperties(prev => {
        const newSet = new Set(prev);
        newSet.delete(pageId);
        return newSet;
      });
    }
  }, []); // No dependencies to prevent recreation

  const loadPropertiesForPages = useCallback(async (targetPageIds: string[]) => {
    console.log('useLazyProperties: loadPropertiesForPages called', { pageCount: targetPageIds.length });
    
    // Filter out pages that are already loaded or loading
    const pagesToLoad = targetPageIds.filter(pageId => 
      !loadedPagesRef.current.has(pageId) && !loadingPagesRef.current.has(pageId)
    );
    
    if (pagesToLoad.length === 0) {
      console.log('useLazyProperties: No pages to load');
      return;
    }
    
    // Load properties sequentially to avoid race conditions
    for (const pageId of pagesToLoad) {
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

  // Reset loaded pages when pageIds change significantly
  useEffect(() => {
    const currentPageIdsSet = new Set(pageIdsRef.current);
    const hasSignificantChange = pageIdsRef.current.length === 0 || 
      pageIdsRef.current.some(id => !loadedPagesRef.current.has(id));
    
    if (hasSignificantChange) {
      // Clear references for pages that are no longer in the list
      const pagesToKeep = new Set();
      for (const pageId of loadedPagesRef.current) {
        if (currentPageIdsSet.has(pageId)) {
          pagesToKeep.add(pageId);
        }
      }
      loadedPagesRef.current = pagesToKeep;
    }
  }, [pageIdsKey]);

  return {
    loadedProperties,
    loadPropertiesForPage,
    loadPropertiesForPages,
    getPropertiesForPage,
    isPageLoading,
    propertyLoadTimes
  };
}
