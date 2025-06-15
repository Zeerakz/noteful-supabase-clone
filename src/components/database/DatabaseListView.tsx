import React from 'react';
import { DatabaseListContent } from './list/DatabaseListContent';
import { GroupedListView } from './grouping/GroupedListView';
import { useOptimisticDatabasePages } from '@/hooks/useOptimisticDatabasePages';
import { useListActions } from '@/hooks/database/useListActions';
import { createMultiLevelGroups } from '@/utils/multiLevelGrouping';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { Block } from '@/types/block';

interface DatabaseListViewProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filterGroup: FilterGroup;
  sortRules: SortRule[];
  groupingConfig?: any;
  onGroupingConfigChange?: (config: any) => void;
  collapsedGroups?: string[];
  onToggleGroupCollapse?: (groupKey: string) => void;
}

interface PageWithProperties {
  pageId: string;
  title: string;
  properties: Record<string, any>;
}

export function DatabaseListView({ 
  databaseId, 
  workspaceId, 
  fields, 
  filterGroup, 
  sortRules,
  groupingConfig,
  onGroupingConfigChange,
  collapsedGroups = [],
  onToggleGroupCollapse
}: DatabaseListViewProps) {
  const { 
    pages, 
    loading, 
    error, 
    refetch,
    optimisticUpdateProperty,
    optimisticUpdatePage,
    optimisticCreatePage
  } = useOptimisticDatabasePages({
    databaseId,
    workspaceId,
    filterGroup,
    fields,
    sortRules,
  });

  const { handleFieldEdit, handleTitleEdit, handleCreateEntry } = useListActions(
    databaseId,
    workspaceId,
    refetch
  );

  // Enhanced handlers with optimistic updates
  const handleOptimisticFieldEdit = (pageId: string, fieldId: string, value: any) => {
    optimisticUpdateProperty({ pageId, fieldId, value });
    handleFieldEdit(pageId, fieldId, value);
  };

  const handleOptimisticTitleEdit = (pageId: string, title: string) => {
    optimisticUpdatePage({ pageId, updates: { properties: { title } } });
    handleTitleEdit(pageId, title);
  };

  const handleOptimisticCreateEntry = async () => {
    optimisticCreatePage({ title: 'Untitled' });
    await handleCreateEntry();
  };

  // Transform pages data to expected format
  const pagesWithProperties: PageWithProperties[] = pages.map(page => {
    const properties: Record<string, string> = {};
    
    if (page.page_properties && Array.isArray(page.page_properties)) {
      page.page_properties.forEach((prop: any) => {
        if (prop.field_id && prop.value !== undefined) {
          properties[prop.field_id] = prop.value;
        }
      });
    }
    
    return {
      pageId: page.id,
      title: page.properties?.title || 'Untitled',
      properties,
    };
  });

  // Create grouped data if grouping is configured
  const groupedData = groupingConfig && groupingConfig.levels.length > 0
    ? createMultiLevelGroups(
        pagesWithProperties.map(page => ({
          id: page.pageId,
          title: page.title,
          properties: page.properties,
          groupPath: []
        })),
        fields,
        groupingConfig,
        collapsedGroups
      )
    : [];

  const hasGrouping = groupingConfig && groupingConfig.levels.length > 0;

  return (
    <div className="h-full bg-background">
      {hasGrouping && groupedData.length > 0 ? (
        <GroupedListView
          groups={groupedData}
          fields={fields}
          onToggleGroupCollapse={onToggleGroupCollapse || (() => {})}
          onFieldEdit={handleOptimisticFieldEdit}
          onTitleEdit={handleOptimisticTitleEdit}
        />
      ) : (
        <DatabaseListContent
          pagesWithProperties={pagesWithProperties}
          fields={fields}
          loading={loading}
          error={error}
          onCreateEntry={handleOptimisticCreateEntry}
          onFieldEdit={handleOptimisticFieldEdit}
          onTitleEdit={handleOptimisticTitleEdit}
          onRefetch={refetch}
        />
      )}
    </div>
  );
}
