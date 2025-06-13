
import React from 'react';
import { DatabaseTableView } from './DatabaseTableView';
import { DatabaseListView } from './DatabaseListView';
import { DatabaseCalendarView } from './DatabaseCalendarView';
import { DatabaseKanbanView } from './DatabaseKanbanView';
import { DatabaseTimelineView } from './DatabaseTimelineView';
import { DatabaseGalleryView } from './DatabaseGalleryView';
import { DatabaseFormView } from './DatabaseFormView';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/hooks/useDatabaseSorting';
import { GroupingConfig } from '@/hooks/useDatabaseViewSelector';

export type DatabaseViewType = 'table' | 'list' | 'timeline' | 'calendar' | 'kanban' | 'form' | 'gallery';

interface DatabaseViewRendererProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  currentView: DatabaseViewType;
  filterGroup: FilterGroup;
  sortRules: SortRule[];
  groupingConfig: GroupingConfig;
  collapsedGroups: string[];
  onToggleGroupCollapse: (groupKey: string) => void;
  onFieldsChange: () => void;
}

export function DatabaseViewRenderer({
  databaseId,
  workspaceId,
  fields,
  currentView,
  filterGroup,
  sortRules,
  groupingConfig,
  collapsedGroups,
  onToggleGroupCollapse,
  onFieldsChange
}: DatabaseViewRendererProps) {
  const commonProps = {
    databaseId,
    workspaceId,
    fields,
    filterGroup,
    sortRules
  };

  switch (currentView) {
    case 'table':
      return <DatabaseTableView {...commonProps} />;
    case 'list':
      return <DatabaseListView {...commonProps} />;
    case 'calendar':
      return <DatabaseCalendarView {...commonProps} />;
    case 'kanban':
      return <DatabaseKanbanView {...commonProps} />;
    case 'timeline':
      return <DatabaseTimelineView {...commonProps} />;
    case 'gallery':
      return <DatabaseGalleryView {...commonProps} />;
    case 'form':
      return <DatabaseFormView {...commonProps} />;
    default:
      return <DatabaseTableView {...commonProps} />;
  }
}
