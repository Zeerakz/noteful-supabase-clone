
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
import { SortRule } from './SortingModal';
import { DatabaseViewType } from './DatabaseUnifiedToolbar';

interface DatabaseViewRendererProps {
  databaseId: string;
  workspaceId: string;
  viewType: DatabaseViewType;
  fields: DatabaseField[];
  filterGroup: FilterGroup;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
}

export function DatabaseViewRenderer({
  databaseId,
  workspaceId,
  viewType,
  fields,
  filterGroup,
  sortRules,
  setSortRules
}: DatabaseViewRendererProps) {
  const commonProps = {
    databaseId,
    workspaceId,
    fields,
    filterGroup,
    sortRules
  };

  const timelineProps = {
    ...commonProps,
    setSortRules
  };

  switch (viewType) {
    case 'table':
      return <DatabaseTableView {...timelineProps} />;
    case 'list':
      return <DatabaseListView {...commonProps} />;
    case 'calendar':
      return <DatabaseCalendarView {...commonProps} />;
    case 'kanban':
      return <DatabaseKanbanView {...commonProps} />;
    case 'timeline':
      return <DatabaseTimelineView {...timelineProps} />;
    case 'gallery':
      return <DatabaseGalleryView {...commonProps} />;
    case 'form':
      return <DatabaseFormView {...commonProps} />;
    default:
      return <DatabaseTableView {...timelineProps} />;
  }
}
