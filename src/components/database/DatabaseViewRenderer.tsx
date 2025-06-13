
import React from 'react';
import { DatabaseTableView } from './DatabaseTableView';
import { DatabaseListView } from './DatabaseListView';
import { DatabaseKanbanView } from './DatabaseKanbanView';
import { DatabaseCalendarView } from './DatabaseCalendarView';
import { DatabaseGalleryView } from './DatabaseGalleryView';
import { DatabaseTimelineView } from './DatabaseTimelineView';
import { DatabaseViewType } from './DatabaseViewSelector';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from './SortingModal';
import { GroupingConfig } from '@/types/grouping';

interface DatabaseViewRendererProps {
  currentViewType: DatabaseViewType;
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filterGroup: FilterGroup;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
  groupingFieldId?: string;
  collapsedGroups: string[];
  onToggleGroupCollapse: (groupValue: string) => void;
  onFieldsChange?: () => void;
  groupingConfig?: GroupingConfig;
  onGroupingConfigChange?: (config: GroupingConfig) => void;
}

export function DatabaseViewRenderer({
  currentViewType,
  databaseId,
  workspaceId,
  fields,
  filterGroup,
  sortRules,
  setSortRules,
  groupingFieldId,
  collapsedGroups,
  onToggleGroupCollapse,
  onFieldsChange,
  groupingConfig,
  onGroupingConfigChange,
}: DatabaseViewRendererProps) {
  const commonProps = {
    databaseId,
    workspaceId,
    fields,
    filterGroup,
    sortRules,
    setSortRules,
    onFieldsChange,
  };

  const groupingProps = {
    groupingConfig,
    onGroupingConfigChange,
    collapsedGroups,
    onToggleGroupCollapse,
  };

  switch (currentViewType) {
    case 'table':
      return (
        <DatabaseTableView 
          {...commonProps}
          {...groupingProps}
        />
      );

    case 'list':
      return (
        <DatabaseListView 
          {...commonProps}
          {...groupingProps}
        />
      );

    case 'kanban':
      return (
        <DatabaseKanbanView
          databaseId={databaseId}
          workspaceId={workspaceId}
          fields={fields}
          filterGroup={filterGroup}
          sortRules={sortRules}
        />
      );

    case 'calendar':
      return (
        <DatabaseCalendarView
          databaseId={databaseId}
          workspaceId={workspaceId}
          fields={fields}
          filterGroup={filterGroup}
          sortRules={sortRules}
        />
      );

    case 'gallery':
      return <DatabaseGalleryView {...commonProps} />;

    case 'timeline':
      return <DatabaseTimelineView {...commonProps} />;

    default:
      return <DatabaseTableView {...commonProps} />;
  }
}
