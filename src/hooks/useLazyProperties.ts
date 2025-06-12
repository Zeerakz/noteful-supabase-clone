
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

  // Use refs to track page IDs and fields by their content, not reference
  const pageIdsLengthRef = useRef(pageIds.length);
  const pageIdsHashRef = useRef(pageIds.join(','));
  const fieldsHashRef = useRef(JSON.stringify(fields));

  // Check if pageIds or fields have actually changed
  const currentPageIdsHash = pageIds.join(',');
  const currentFieldsHash = JSON.stringify(fields);
  
  const pageIdsChanged = pageIdsHashRef.current !== currentPageIdsHash;
  const fieldsChanged = fieldsHashRef.current !== currentFieldsHash;
  
  if (pageIdsChanged) {
    console.log('useLazyProperties: Page IDs changed', { 
      oldLength: pageIdsLengthRef.current,
      newLength: pageIds.length,
      oldHash: pageIdsHashRef.current.substring(0, 50),
      newHash: currentPageIdsHash.substring(0, 50)
    });
    pageIdsLengthRef.current = pageIds.length;
    pageIdsHashRef.current = currentPageIdsHash;
  }
  
  if (fieldsChanged) {
    console.log('useLazyProperties: Fields changed');
    fieldsHashRef.current = currentFieldsHash;
  }

  const loadPropertiesForPage = useCallback(async (pageId: string) => {
    console.log('useLazyProperties: loadPropertiesForPage called', { pageId, enabled });
    
    if (!enabled || loadedProperties[pageId] || loadingProperties.has(pageId)) {
      console.log('useLazyProperties: Skipping load', { 
        enabled, 
        alreadyLoaded: !!loadedProperties[pageId], 
        currentlyLoading: loadingProperties.has(pageId) 
      });
      return;
    }

    const startTime = performance.now();
    setLoadingProperties(prev => {
      const newSet = new Set(prev);
      newSet.add(pageId);
      return newSet;
    });

    try {
      console.log('useLazyProperties: Fetching properties for page', pageId);
      const { data, error } = await PageService.getPageProperties(pageId);
      
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
    } catch (err) {
      console.error('useLazyProperties: Exception loading properties', { pageId, error: err });
    } finally {
      setLoadingProperties(prev => {
        const newSet = new Set(prev);
        newSet.delete(pageId);
        return newSet;
      });
    }
  }, [enabled, loadedProperties, loadingProperties]);

  const loadPropertiesForPages = useCallback(async (pageIds: string[]) => {
    console.log('useLazyProperties: loadPropertiesForPages called', { pageCount: pageIds.length });
    
    const unloadedPages = pageIds.filter(id => !loadedProperties[id] && !loadingProperties.has(id));
    console.log('useLazyProperties: Unloaded pages to fetch', { unloadedCount: unloadedPages.length });
    
    await Promise.all(unloadedPages.map(loadPropertiesForPage));
  }, [loadPropertiesForPage, loadedProperties, loadingProperties]);

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
