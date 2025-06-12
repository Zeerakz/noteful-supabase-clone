
import { useState, useEffect, useCallback } from 'react';
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

  const loadPropertiesForPage = useCallback(async (pageId: string) => {
    if (!enabled || loadedProperties[pageId] || loadingProperties.has(pageId)) {
      return;
    }

    const startTime = performance.now();
    setLoadingProperties(prev => new Set(prev).add(pageId));

    try {
      const { data, error } = await PageService.getPageProperties(pageId);
      
      if (!error && data) {
        const properties: Record<string, string> = {};
        data.forEach((prop: any) => {
          properties[prop.field_id] = prop.value || '';
        });

        setLoadedProperties(prev => ({
          ...prev,
          [pageId]: properties
        }));

        const loadTime = performance.now() - startTime;
        setPropertyLoadTimes(prev => ({
          ...prev,
          [pageId]: loadTime
        }));
      }
    } catch (err) {
      console.error('Failed to load properties for page:', pageId, err);
    } finally {
      setLoadingProperties(prev => {
        const newSet = new Set(prev);
        newSet.delete(pageId);
        return newSet;
      });
    }
  }, [enabled, loadedProperties, loadingProperties]);

  const loadPropertiesForPages = useCallback(async (pageIds: string[]) => {
    const unloadedPages = pageIds.filter(id => !loadedProperties[id] && !loadingProperties.has(id));
    await Promise.all(unloadedPages.map(loadPropertiesForPage));
  }, [loadPropertiesForPage, loadedProperties, loadingProperties]);

  const getPropertiesForPage = useCallback((pageId: string) => {
    return loadedProperties[pageId] || {};
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
