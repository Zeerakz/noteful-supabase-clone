
import React from 'react';
import { DatabaseViewType } from './DatabaseViewSelector';
import { DatabaseTableView } from './DatabaseTableView';
import { DatabaseListView } from './DatabaseListView';
import { DatabaseTimelineView } from './DatabaseTimelineView';
import { DatabaseCalendarView } from './DatabaseCalendarView';
import { DatabaseKanbanView } from './DatabaseKanbanView';
import { DatabaseGalleryView } from './DatabaseGalleryView';
import { DatabaseFormView } from './DatabaseFormView';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from './SortingModal';

interface DatabaseViewRendererProps {
  currentViewType: DatabaseViewType;
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filterGroup: FilterGroup;
  sortRules: SortRule[];
  groupingFieldId?: string;
  collapsedGroups: string[];
  onToggleGroupCollapse: (groupValue: string) => void;
}

export function DatabaseViewRenderer({
  currentViewType,
  databaseId,
  workspaceId,
  fields,
  filterGroup,
  sortRules,
  groupingFieldId,
  collapsedGroups,
  onToggleGroupCollapse,
}: DatabaseViewRendererProps) {
  const commonProps = {
    databaseId,
    workspaceId,
    fields,
    filterGroup,
    sortRules,
    groupingFieldId,
    collapsedGroups,
    onToggleGroupCollapse,
  };

  switch (currentViewType) {
    case 'table':
      return <DatabaseTableView {...commonProps} />;
    case 'list':
      return <DatabaseListView {...commonProps} />;
    case 'timeline':
      return <DatabaseTimelineView {...commonProps} />;
    case 'calendar':
      return <DatabaseCalendarView {...commonProps} />;
    case 'kanban':
      return <DatabaseKanbanView {...commonProps} />;
    case 'gallery':
      return <DatabaseGalleryView {...commonProps} />;
    case 'form':
      return (
        <DatabaseFormView
          databaseId={databaseId}
          fields={fields}
          workspaceId={workspaceId}
        />
      );
    default:
      return null;
  }
}
