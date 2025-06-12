
import React from 'react';
import { DatabaseTableView } from './DatabaseTableView';
import { DatabaseListView } from './DatabaseListView';
import { DatabaseKanbanView } from './DatabaseKanbanView';
import { DatabaseCalendarView } from './DatabaseCalendarView';
import { DatabaseTimelineView } from './DatabaseTimelineView';
import { DatabaseGalleryView } from './DatabaseGalleryView';
import { DatabaseFormView } from './DatabaseFormView';
import { DatabaseViewType } from './DatabaseViewSelector';
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
  setSortRules: (rules: SortRule[]) => void;
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
  setSortRules,
  groupingFieldId,
  collapsedGroups,
  onToggleGroupCollapse,
}: DatabaseViewRendererProps) {
  const baseProps = {
    databaseId,
    workspaceId,
    fields,
    filterGroup,
    sortRules,
  };

  switch (currentViewType) {
    case 'table':
      return (
        <DatabaseTableView
          {...baseProps}
          setSortRules={setSortRules}
        />
      );

    case 'list':
      return (
        <DatabaseListView
          {...baseProps}
          // Note: groupingFieldId and collapsedGroups are temporarily removed
          // until DatabaseListView interface is updated to support them
        />
      );

    case 'kanban':
      return (
        <DatabaseKanbanView
          {...baseProps}
        />
      );

    case 'calendar':
      return (
        <DatabaseCalendarView
          {...baseProps}
        />
      );

    case 'timeline':
      return (
        <DatabaseTimelineView
          {...baseProps}
        />
      );

    case 'gallery':
      return (
        <DatabaseGalleryView
          {...baseProps}
        />
      );

    case 'form':
      return (
        <DatabaseFormView
          {...baseProps}
        />
      );

    default:
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">
            View type "{currentViewType}" is not implemented yet.
          </div>
        </div>
      );
  }
}
