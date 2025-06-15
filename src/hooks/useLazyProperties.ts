
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

  // Track which pages we've already loaded to prevent duplicates
  const loadedPagesRef = useRef<Set<string>>(new Set());
  const loadingPagesRef = useRef<Set<string>>(new Set());
  
  // Create stable keys for dependency comparison
  const pageIdsKey = pageIds.join(',');
  const fieldsKey = fields.map(f => `${f.id}-${f.type}`).join(',');
  
  // Store the last processed keys to prevent unnecessary re-processing
  const lastPageIdsKeyRef = useRef<string>('');
  const lastFieldsKeyRef = useRef<string>('');

  const loadPropertiesForPage = useCallback(async (pageId: string) => {
    console.log('useLazyProperties: loadPropertiesForPage called', { pageId, enabled });
    
    if (!enabled) {
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
    setLoadingProperties(prev => new Set([...prev, pageId]));
    
    try {
      const { data, error } = await PageService.getPageProperties(pageId);
      
      if (!error && data) {
        const properties: Record<string, string> = {};
        data.forEach((prop: any) => {
          properties[prop.property_id] = prop.value || '';
        });

        console.log('useLazyProperties: Properties loaded successfully', { pageId, propertyCount: Object.keys(properties).length });

        // Mark as loaded
        loadedPagesRef.current.add(pageId);

        // Update loaded properties - use functional update to avoid stale closure
        setLoadedProperties(prev => ({
          ...prev,
          [pageId]: properties
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
  }, [enabled]);

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

  // STABILIZED: Create a stable getPropertiesForPage function that doesn't depend on loadedProperties state
  const getPropertiesForPage = useCallback((pageId: string) => {
    // Access the current state without creating a dependency
    const currentProperties = loadedProperties[pageId] || {};
    return currentProperties;
  }, []); // Empty dependency array makes this function stable

  const isPageLoading = useCallback((pageId: string) => {
    return loadingProperties.has(pageId);
  }, [loadingProperties]);

  // Reset loaded pages when pageIds change significantly
  useEffect(() => {
    if (lastPageIdsKeyRef.current !== pageIdsKey) {
      const currentPageIdsSet = new Set(pageIds);
      
      // Clear references for pages that are no longer in the list
      const pagesToKeep = new Set<string>();
      for (const pageId of loadedPagesRef.current) {
        if (currentPageIdsSet.has(pageId)) {
          pagesToKeep.add(pageId);
        }
      }
      loadedPagesRef.current = pagesToKeep;
      lastPageIdsKeyRef.current = pageIdsKey;
    }
  }, [pageIdsKey, pageIds]);

  // Auto-load properties when pageIds change (but only once per change)
  useEffect(() => {
    if (pageIds.length > 0 && enabled && lastPageIdsKeyRef.current !== pageIdsKey) {
      console.log('useLazyProperties: Auto-loading properties for page IDs change');
      loadPropertiesForPages(pageIds);
    }
  }, [pageIdsKey, enabled, pageIds, loadPropertiesForPages]);

  return {
    loadedProperties,
    loadPropertiesForPage,
    loadPropertiesForPages,
    getPropertiesForPage,
    isPageLoading
  };
}
