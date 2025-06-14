
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useOptimisticDatabasePages } from '@/hooks/useOptimisticDatabasePages';
import { useOptimisticPropertyUpdate } from '@/hooks/useOptimisticPropertyUpdate';
import { PageService } from '@/services/pageService';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { useMemo, useCallback } from 'react';

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

  const propertyUpdateMutation = useOptimisticPropertyUpdate(databaseId);

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

  // Action handlers with optimistic updates
  const handleCreateRow = useCallback(async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a row",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('useDatabaseTableView: Creating new row', { databaseId, workspaceId, userId: user.id });
      
      const { data, error } = await PageService.createPage(
        workspaceId,
        user.id,
        { title: 'Untitled', databaseId }
      );
      
      if (error) {
        console.error('Error creating page:', error);
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        console.log('Page created successfully:', data);
        toast({
          title: "Success",
          description: "New row created",
        });
        // Refetch to get the latest data
        await refetchPages();
      }
    } catch (err) {
      console.error('Exception creating page:', err);
      toast({
        title: "Error",
        description: "Failed to create row",
        variant: "destructive",
      });
    }
  }, [user, workspaceId, databaseId, toast, refetchPages]);

  const handleDeleteRow = useCallback(async (pageId: string) => {
    try {
      console.log('useDatabaseTableView: Deleting row', { pageId });
      
      // Optimistic update
      optimisticDeletePage(pageId);
      
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
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete row",
        variant: "destructive",
      });
    }
  }, [toast, optimisticDeletePage]);

  const handleTitleUpdate = useCallback(async (pageId: string, newTitle: string) => {
    if (!user) return;
    optimisticUpdatePage(pageId, { title: newTitle });
    const { error } = await PageService.updatePage(pageId, { title: newTitle });
    if (error) {
      toast({ title: "Error", description: `Failed to update title: ${error}`, variant: "destructive" });
    }
  }, [user, optimisticUpdatePage, toast]);

  const handlePropertyUpdate = useCallback(async (pageId: string, fieldId: string, value: string) => {
    if (!user) return;
    optimisticUpdateProperty(pageId, fieldId, value);
    try {
      await propertyUpdateMutation.mutateAsync({ pageId, fieldId, value });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update property", variant: "destructive" });
    }
  }, [user, optimisticUpdateProperty, propertyUpdateMutation, toast]);

  const totalPages = enablePagination ? Math.ceil(pages.length / itemsPerPage) : 1;

  return {
    pagesWithProperties: paginatedPages,
    pagesLoading,
    pagesError,
    refetchPages,
    handleCreateRow,
    handleDeleteRow,
    handleTitleUpdate,
    handlePropertyUpdate,
    pagination: null,
    totalPages,
  };
}
