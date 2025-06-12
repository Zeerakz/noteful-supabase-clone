
import { useState, useEffect } from 'react';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { useFilteredDatabasePages } from '@/hooks/useFilteredDatabasePages';

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
  page_properties?: Array<{
    id: string;
    page_id: string;
    field_id: string;
    value: string;
    created_by: string;
    created_at: string;
    updated_at: string;
  }>;
}

interface UseOptimisticDatabasePagesProps {
  databaseId: string;
  filterGroup: FilterGroup;
  fields: DatabaseField[];
  sortRules: SortRule[];
}

export function useOptimisticDatabasePages({ 
  databaseId, 
  filterGroup, 
  fields, 
  sortRules 
}: UseOptimisticDatabasePagesProps) {
  const { pages: serverPages, loading, error, refetch } = useFilteredDatabasePages({
    databaseId,
    filterGroup,
    fields,
    sortRules,
  });
  
  const [optimisticPages, setOptimisticPages] = useState<PageWithProperties[]>([]);

  // Sync optimistic pages with server pages
  useEffect(() => {
    setOptimisticPages(serverPages);
  }, [serverPages]);

  const optimisticCreatePage = (page: { title: string; properties?: Record<string, string> }) => {
    const tempId = `temp-${Date.now()}`;
    const newPage: PageWithProperties = {
      id: tempId,
      title: page.title,
      workspace_id: '',
      database_id: databaseId,
      created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parent_page_id: null,
      order_index: optimisticPages.length,
      page_properties: page.properties ? Object.entries(page.properties).map(([fieldId, value]) => ({
        id: `temp-prop-${Date.now()}-${fieldId}`,
        page_id: tempId,
        field_id: fieldId,
        value,
        created_by: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) : [],
    };

    setOptimisticPages(prev => [newPage, ...prev]);
    return tempId;
  };

  const optimisticUpdatePage = (pageId: string, updates: Partial<PageWithProperties>) => {
    setOptimisticPages(prev => 
      prev.map(page => 
        page.id === pageId 
          ? { ...page, ...updates, updated_at: new Date().toISOString() }
          : page
      )
    );
  };

  const optimisticUpdateProperty = (pageId: string, fieldId: string, value: string) => {
    setOptimisticPages(prev => prev.map(page => {
      if (page.id !== pageId) return page;
      
      const properties = page.page_properties || [];
      const existingIndex = properties.findIndex(prop => prop.field_id === fieldId);
      
      let updatedProperties;
      if (existingIndex >= 0) {
        updatedProperties = properties.map((prop, index) => 
          index === existingIndex 
            ? { ...prop, value, updated_at: new Date().toISOString() }
            : prop
        );
      } else {
        updatedProperties = [...properties, {
          id: `temp-prop-${Date.now()}`,
          page_id: pageId,
          field_id: fieldId,
          value,
          created_by: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }];
      }
      
      return {
        ...page,
        page_properties: updatedProperties,
        updated_at: new Date().toISOString(),
      };
    }));
  };

  const optimisticDeletePage = (pageId: string) => {
    setOptimisticPages(prev => prev.filter(page => page.id !== pageId));
  };

  const revertOptimisticChanges = () => {
    setOptimisticPages(serverPages);
  };

  return {
    pages: optimisticPages,
    loading,
    error,
    refetch,
    optimisticCreatePage,
    optimisticUpdatePage,
    optimisticUpdateProperty,
    optimisticDeletePage,
    revertOptimisticChanges,
  };
}
