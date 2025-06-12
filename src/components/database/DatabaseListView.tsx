
import React from 'react';
import { DatabaseListContent } from './list/DatabaseListContent';
import { useFilteredDatabasePages } from '@/hooks/useFilteredDatabasePages';
import { useListActions } from '@/hooks/database/useListActions';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';

interface DatabaseListViewProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filterGroup: FilterGroup;
  sortRules: SortRule[];
}

interface PageWithProperties {
  pageId: string;
  title: string;
  properties: Record<string, string>;
}

export function DatabaseListView({ 
  databaseId, 
  workspaceId, 
  fields, 
  filterGroup, 
  sortRules 
}: DatabaseListViewProps) {
  const { pages, loading, error, refetch } = useFilteredDatabasePages({
    databaseId,
    filterGroup,
    fields,
    sortRules,
  });

  const { handleFieldEdit, handleTitleEdit, handleCreateEntry } = useListActions(
    databaseId,
    workspaceId,
    refetch
  );

  // Transform pages data to expected format - simplified
  const pagesWithProperties: PageWithProperties[] = pages.map(page => {
    const properties: Record<string, string> = {};
    
    if (page.page_properties && Array.isArray(page.page_properties)) {
      page.page_properties.forEach((prop: any) => {
        if (prop.field_id && prop.value !== undefined) {
          properties[prop.field_id] = prop.value || '';
        }
      });
    }
    
    return {
      pageId: page.id,
      title: page.title,
      properties,
    };
  });

  return (
    <DatabaseListContent
      pagesWithProperties={pagesWithProperties}
      fields={fields}
      loading={loading}
      error={error}
      onCreateEntry={handleCreateEntry}
      onFieldEdit={handleFieldEdit}
      onTitleEdit={handleTitleEdit}
      onRefetch={refetch}
    />
  );
}
