
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFilteredDatabasePages } from '@/hooks/useFilteredDatabasePages';
import { useOptimisticPropertyUpdate } from '@/hooks/useOptimisticPropertyUpdate';
import { useLazyProperties } from '@/hooks/useLazyProperties';
import { useViewCache } from '@/hooks/useViewCache';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';
import { usePagination } from '@/hooks/usePagination';
import { PageService } from '@/services/pageService';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { useEffect, useMemo, useCallback, useRef } from 'react';

interface PageWithProperties {
  id: string;
  title: string;
  workspace_id: string;
  database_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  parent_page_id: string | null;
  order_index: number;
  properties: Record<string, string>;
}

interface UseDatabaseTableViewProps {
  databaseId: string;
  workspaceId: string;
  filterGroup: FilterGroup;
  fields: DatabaseField[];
  sortRules: SortRule[];
  enablePagination?: boolean;
  itemsPerPage?: number;
  enableVirtualScrolling?: boolean;
}

export function useDatabaseTableView({
  databaseId,
  workspaceId,
  filterGroup,
  fields,
  sortRules,
  enablePagination = false,
  itemsPerPage = 50,
  enableVirtualScrolling = false
}: UseDatabaseTableViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { startTimer, endTimer } = usePerformanceMetrics();

  console.log('useDatabaseTableView: Hook called', { 
    databaseId, 
    workspaceId, 
    fieldsCount: fields.length,
    filterRules: filterGroup.rules.length,
    sortRules: sortRules.length,
    enablePagination,
    enableVirtualScrolling
  });

  // Stabilize fields with a single ref approach
  const fieldsRef = useRef<DatabaseField[]>(fields);
  const fieldsStrRef = useRef<string>(JSON.stringify(fields));
  
  // Only update when fields actually change
  const currentFieldsStr = JSON.stringify(fields);
  if (fieldsStrRef.current !== currentFieldsStr) {
    console.log('useDatabaseTableView: Fields changed, updating refs');
    fieldsRef.current = fields;
    fieldsStrRef.current = currentFieldsStr;
  }
  
  const stableFields = fieldsRef.current;
  
  // Stabilize cache configuration - create once and reuse
  const cache = useViewCache(useMemo(() => ({
    cacheKey: `table-${databaseId}`,
    ttl: 5 * 60 * 1000 // 5 minutes
  }), [databaseId]));

  // Track performance with stable metadata
  const performanceStartedRef = useRef(false);
  const performanceMetadata = useRef({
    databaseId, 
    enablePagination, 
    enableVirtualScrolling,
    filterCount: filterGroup.rules.length,
    sortCount: sortRules.length
  });

  // Only start performance timer once
  useEffect(() => {
    if (!performanceStartedRef.current) {
      console.log('useDatabaseTableView: Starting performance timer');
      startTimer('page_load', performanceMetadata.current);
      performanceStartedRef.current = true;
    }
  }, [startTimer]); // Only depend on startTimer
  
  const { 
    pages, 
    loading: pagesLoading, 
    error: pagesError,
    refetch: refetchPages
  } = useFilteredDatabasePages({
    databaseId,
    filterGroup,
    fields: stableFields,
    sortRules
  });

  console.log('useDatabaseTableView: Pages data', { 
    pagesCount: pages.length, 
    pagesLoading, 
    pagesError 
  });

  const propertyUpdateMutation = useOptimisticPropertyUpdate(databaseId);

  // Pagination with stable configuration
  const paginationConfig = useMemo(() => ({
    totalItems: pages.length,
    itemsPerPage,
    initialPage: 1
  }), [pages.length, itemsPerPage]);

  const pagination = usePagination(paginationConfig);

  // Get current page items - stable calculation
  const currentPageItems = useMemo(() => {
    const items = !enablePagination ? pages : pages.slice(pagination.startIndex, pagination.endIndex);
    console.log('useDatabaseTableView: Current page items calculated', { 
      totalPages: pages.length, 
      currentItems: items.length,
      enablePagination,
      startIndex: pagination.startIndex,
      endIndex: pagination.endIndex
    });
    return items;
  }, [pages, enablePagination, pagination.startIndex, pagination.endIndex]);

  // Extract page IDs once and memoize
  const pageIds = useMemo(() => {
    const ids = currentPageItems.map(page => page.id);
    console.log('useDatabaseTableView: Page IDs extracted', { count: ids.length });
    return ids;
  }, [currentPageItems]);
  
  const {
    getPropertiesForPage,
    loadPropertiesForPages,
    isPageLoading
  } = useLazyProperties({
    pageIds,
    fields: stableFields,
    enabled: currentPageItems.length > 0
  });

  // Load properties effect - break the dependency chain
  useEffect(() => {
    if (pageIds.length > 0 && !pagesLoading) {
      console.log('useDatabaseTableView: Loading properties for pages', { count: pageIds.length });
      
      const loadProperties = async () => {
        startTimer('property_load');
        await loadPropertiesForPages(pageIds);
        endTimer('property_load');
      };
      
      loadProperties();
    }
  }, [pageIds.length, pagesLoading, loadPropertiesForPages, startTimer, endTimer]); // Depend on length, not the array

  // End performance tracking when pages finish loading
  useEffect(() => {
    if (!pagesLoading && pages.length >= 0 && performanceStartedRef.current) {
      console.log('useDatabaseTableView: Ending performance timer');
      endTimer('page_load');
      performanceStartedRef.current = false;
    }
  }, [pagesLoading, pages.length, endTimer]);

  // Transform pages data with properties - optimize caching
  const pagesWithProperties: PageWithProperties[] = useMemo(() => {
    console.log('useDatabaseTableView: Computing pages with properties', { pageCount: currentPageItems.length });
    
    return currentPageItems.map(page => {
      const cacheKey = `page-${page.id}`;
      let properties = cache.get(cacheKey);
      
      if (!properties) {
        const pageProperties = getPropertiesForPage(page.id);
        properties = pageProperties && typeof pageProperties === 'object' 
          ? pageProperties as Record<string, string>
          : {};
        
        if (Object.keys(properties).length > 0) {
          cache.set(cacheKey, properties);
        }
      }

      return {
        id: page.id,
        title: page.title,
        workspace_id: page.workspace_id,
        database_id: page.database_id,
        created_by: page.created_by,
        created_at: page.created_at,
        updated_at: page.updated_at,
        parent_page_id: page.parent_page_id,
        order_index: page.order_index,
        properties: properties as Record<string, string>,
      };
    });
  }, [currentPageItems, cache, getPropertiesForPage]);

  // Stabilize action handlers
  const handleCreateRow = useCallback(async () => {
    if (!user) return;

    try {
      console.log('useDatabaseTableView: Creating new row');
      startTimer('create_row');
      const { data, error } = await PageService.createPage(
        workspaceId,
        user.id,
        { title: 'Untitled', databaseId }
      );
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "New row created",
        });
        cache.invalidate();
        refetchPages();
      }
      endTimer('create_row');
    } catch (err) {
      endTimer('create_row');
      toast({
        title: "Error",
        description: "Failed to create row",
        variant: "destructive",
      });
    }
  }, [user, workspaceId, databaseId, startTimer, endTimer, toast, cache, refetchPages]);

  const handleDeleteRow = useCallback(async (pageId: string) => {
    try {
      console.log('useDatabaseTableView: Deleting row', { pageId });
      startTimer('delete_row');
      const { error } = await PageService.deletePage(pageId);
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Row deleted",
        });
        cache.invalidate(`page-${pageId}`);
        refetchPages();
      }
      endTimer('delete_row');
    } catch (err) {
      endTimer('delete_row');
      toast({
        title: "Error",
        description: "Failed to delete row",
        variant: "destructive",
      });
    }
  }, [startTimer, endTimer, toast, cache, refetchPages]);

  const handleTitleUpdate = useCallback(async (pageId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    try {
      console.log('useDatabaseTableView: Updating title', { pageId, newTitle });
      startTimer('update_title');
      const { error } = await PageService.updatePage(pageId, { title: newTitle.trim() });
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        cache.invalidate(`page-${pageId}`);
        refetchPages();
      }
      endTimer('update_title');
    } catch (err) {
      endTimer('update_title');
      toast({
        title: "Error",
        description: "Failed to update title",
        variant: "destructive",
      });
    }
  }, [startTimer, endTimer, toast, cache, refetchPages]);

  const handlePropertyUpdate = useCallback((pageId: string, fieldId: string, value: string) => {
    console.log('useDatabaseTableView: Updating property', { pageId, fieldId, value });
    cache.invalidate(`page-${pageId}`);
    propertyUpdateMutation.mutate({
      pageId,
      fieldId,
      value
    });
  }, [cache, propertyUpdateMutation]);

  console.log('useDatabaseTableView: Returning data', { 
    pagesWithPropertiesCount: pagesWithProperties.length,
    pagesLoading,
    pagesError,
    totalPages: pages.length
  });

  return {
    pagesWithProperties,
    pagesLoading,
    pagesError,
    refetchPages,
    handleCreateRow,
    handleDeleteRow,
    handleTitleUpdate,
    handlePropertyUpdate,
    pagination: enablePagination ? pagination : null,
    totalPages: pages.length,
    isPageLoading,
    cache
  };
}
