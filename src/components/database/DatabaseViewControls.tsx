
import React from 'react';
import { Button } from '@/components/ui/button';
import { Filter, SortAsc, Plus, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DatabaseField } from '@/types/database';
import { DatabaseViewTabs } from './DatabaseViewTabs';
import { DatabaseViewType } from './DatabaseViewSelector';
import { DatabaseGroupingControls } from './DatabaseGroupingControls';
import { FilterGroup } from '@/types/filters';
import { SortRule } from './SortingModal';

interface DatabaseViewControlsProps {
  fields: DatabaseField[];
  currentViewType: DatabaseViewType;
  onViewChange: (view: DatabaseViewType) => void;
  groupingFieldId?: string;
  onGroupingChange: (fieldId?: string) => void;
  filterGroup: FilterGroup;
  setFilterGroup: (group: FilterGroup) => void;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
  hasActiveFilters: boolean;
  hasActiveSorts: boolean;
  clearFilters: () => void;
  clearSorts: () => void;
  showFilterModal: boolean;
  setShowFilterModal: (show: boolean) => void;
  showSortModal: boolean;
  setShowSortModal: (show: boolean) => void;
}

export function DatabaseViewControls({
  fields,
  currentViewType,
  onViewChange,
  groupingFieldId,
  onGroupingChange,
  hasActiveFilters,
  hasActiveSorts,
  setShowFilterModal,
  setShowSortModal,
}: DatabaseViewControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
      {/* View Tabs */}
      <DatabaseViewTabs
        currentView={currentViewType}
        onViewChange={onViewChange}
        className="flex-1"
      />

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Grouping Controls */}
        <DatabaseGroupingControls
          fields={fields}
          groupingFieldId={groupingFieldId}
          onGroupingChange={onGroupingChange}
        />

        {/* Filter Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilterModal(true)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              !
            </Badge>
          )}
        </Button>

        {/* Sort Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSortModal(true)}
          className="gap-2"
        >
          <SortAsc className="h-4 w-4" />
          <span className="hidden sm:inline">Sort</span>
          {hasActiveSorts && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              !
            </Badge>
          )}
        </Button>

        {/* New Record Button */}
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New</span>
        </Button>

        {/* More Options */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
