
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
import { useEffect, useMemo, useCallback } from 'react';

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
  
  // Stabilize fields to prevent infinite re-renders
  const stableFields = useMemo(() => fields, [JSON.stringify(fields)]);
  
  // Stabilize cache configuration to prevent re-creation
  const cacheConfig = useMemo(() => ({
    cacheKey: `table-${databaseId}`,
    ttl: 5 * 60 * 1000 // 5 minutes
  }), [databaseId]);
  
  const cache = useViewCache(cacheConfig);

  // Start performance tracking - memoize to prevent infinite re-renders
  const performanceMetadata = useMemo(() => ({
    databaseId, 
    enablePagination, 
    enableVirtualScrolling,
    filterCount: filterGroup.rules.length,
    sortCount: sortRules.length
  }), [databaseId, enablePagination, enableVirtualScrolling, filterGroup.rules.length, sortRules.length]);

  useEffect(() => {
    startTimer('page_load', performanceMetadata);
  }, [startTimer, performanceMetadata]);
  
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

  // End performance tracking when pages load
  useEffect(() => {
    if (!pagesLoading && pages.length > 0) {
      endTimer('page_load');
    }
  }, [pagesLoading, pages.length, endTimer]);

  const propertyUpdateMutation = useOptimisticPropertyUpdate(databaseId);

  // Pagination - memoize configuration
  const paginationConfig = useMemo(() => ({
    totalItems: pages.length,
    itemsPerPage,
    initialPage: 1
  }), [pages.length, itemsPerPage]);

  const pagination = usePagination(paginationConfig);

  // Get current page items - memoize to prevent unnecessary recalculations
  const currentPageItems = useMemo(() => {
    if (!enablePagination) return pages;
    return pages.slice(pagination.startIndex, pagination.endIndex);
  }, [pages, enablePagination, pagination.startIndex, pagination.endIndex]);

  // Lazy load properties for visible pages
  const pageIds = useMemo(() => currentPageItems.map(page => page.id), [currentPageItems]);
  
  const {
    getPropertiesForPage,
    loadPropertiesForPages,
    isPageLoading
  } = useLazyProperties({
    pageIds,
    fields: stableFields,
    enabled: currentPageItems.length > 0
  });

  // Load properties for current page items - memoize callback
  const loadPageProperties = useCallback(async () => {
    if (pageIds.length > 0) {
      startTimer('property_load');
      await loadPropertiesForPages(pageIds);
      endTimer('property_load');
    }
  }, [pageIds, loadPropertiesForPages, startTimer, endTimer]);

  useEffect(() => {
    loadPageProperties();
  }, [loadPageProperties]);

  // Transform pages data with properties - memoize to prevent re-computation
  const pagesWithProperties: PageWithProperties[] = useMemo(() => {
    return currentPageItems.map(page => {
      const cacheKey = `page-${page.id}`;
      let properties = cache.get(cacheKey);
      
      if (!properties) {
        const pageProperties = getPropertiesForPage(page.id);
        // Ensure properties is always Record<string, string>
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

  // Memoize action handlers to prevent re-creation
  const handleCreateRow = useCallback(async () => {
    if (!user) return;

    try {
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
    cache.invalidate(`page-${pageId}`);
    propertyUpdateMutation.mutate({
      pageId,
      fieldId,
      value
    });
  }, [cache, propertyUpdateMutation]);

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
