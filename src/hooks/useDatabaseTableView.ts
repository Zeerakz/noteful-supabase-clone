import { useOptimisticDatabasePages } from '@/hooks/useOptimisticDatabasePages';
import { useDatabaseRowActions } from '@/hooks/useDatabaseRowActions';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { useMemo } from 'react';

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
  console.log('useDatabaseTableView: Hook called', { 
    databaseId, 
    workspaceId, 
    fieldsCount: fields.length,
    filterRules: filterGroup.rules.length,
    sortRules: sortRules.length,
    enablePagination,
    enableVirtualScrolling
  });

  // Use optimistic pages hook
  const { 
    pages, 
    loading: pagesLoading, 
    error: pagesError,
    refetch: refetchPages,
    optimisticCreatePage,
    optimisticUpdatePage,
    optimisticDeletePage,
    optimisticUpdateProperty
  } = useOptimisticDatabasePages({
    databaseId,
    filterGroup,
    fields,
    sortRules,
  });

  console.log('useDatabaseTableView: Pages data', { 
    pagesCount: pages.length, 
    pagesLoading, 
    pagesError 
  });

  const rowActions = useDatabaseRowActions({
    databaseId,
    workspaceId,
    refetchPages,
    optimisticUpdatePage,
    optimisticDeletePage,
    optimisticUpdateProperty,
  });

  // Transform pages data - simplified and memoized properly
  const pagesWithProperties: PageWithProperties[] = useMemo(() => {
    console.log('useDatabaseTableView: Computing pages with properties', { pageCount: pages.length });
    
    return pages.map(page => {
      const properties: Record<string, string> = {};
      
      // Transform page_properties array to properties object
      if (page.page_properties && Array.isArray(page.page_properties)) {
        page.page_properties.forEach((prop: any) => {
          if (prop.field_id && prop.value !== undefined) {
            properties[prop.field_id] = prop.value || '';
          }
        });
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
        properties,
      };
    });
  }, [pages]);

  // Pagination logic
  const paginatedPages = useMemo(() => {
    if (!enablePagination) return pagesWithProperties;
    
    const startIndex = 0; // For simplicity, start with first page
    const endIndex = Math.min(startIndex + itemsPerPage, pagesWithProperties.length);
    
    return pagesWithProperties.slice(startIndex, endIndex);
  }, [pagesWithProperties, enablePagination, itemsPerPage]);

  const totalPages = enablePagination ? Math.ceil(pages.length / itemsPerPage) : 1;

  return {
    pagesWithProperties: paginatedPages,
    pagesLoading,
    pagesError,
    refetchPages,
    ...rowActions,
    pagination: null,
    totalPages,
  };
}
