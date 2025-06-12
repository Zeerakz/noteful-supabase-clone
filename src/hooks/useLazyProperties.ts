
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

    // Check current state instead of stale closure values
    setLoadingProperties(currentLoading => {
      setLoadedProperties(currentLoaded => {
        if (currentLoaded[pageId] || currentLoading.has(pageId)) {
          console.log('useLazyProperties: Skipping load - already loaded or loading');
          return currentLoaded;
        }

        // Start loading
        const newLoading = new Set(currentLoading);
        newLoading.add(pageId);
        setLoadingProperties(newLoading);

        const startTime = performance.now();
        
        PageService.getPageProperties(pageId)
          .then(({ data, error }) => {
            if (!error && data) {
              const properties: Record<string, string> = {};
              data.forEach((prop: any) => {
                properties[prop.field_id] = prop.value || '';
              });

              console.log('useLazyProperties: Properties loaded successfully', { pageId, propertyCount: Object.keys(properties).length });

              setLoadedProperties(prev => ({
                ...prev,
                [pageId]: properties
              }));

              const loadTime = performance.now() - startTime;
              setPropertyLoadTimes(prev => ({
                ...prev,
                [pageId]: loadTime
              }));
            } else {
              console.error('useLazyProperties: Error loading properties', { pageId, error });
            }
          })
          .catch(err => {
            console.error('useLazyProperties: Exception loading properties', { pageId, error: err });
          })
          .finally(() => {
            setLoadingProperties(prev => {
              const newSet = new Set(prev);
              newSet.delete(pageId);
              return newSet;
            });
          });

        return currentLoaded;
      });
      return currentLoading;
    });
  }, []);

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
