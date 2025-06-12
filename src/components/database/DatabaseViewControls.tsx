
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, SortAsc, Plus, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DatabaseField } from '@/types/database';
import { DatabaseViewTabs } from './DatabaseViewTabs';
import { DatabaseViewType } from './DatabaseViewSelector';
import { DatabaseGroupingControls } from './DatabaseGroupingControls';
import { DatabasePrimaryToolbar } from './DatabasePrimaryToolbar';
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
  const [searchQuery, setSearchQuery] = useState('');

  const handleNewRecord = () => {
    // TODO: Implement new record creation
    console.log('Creating new record...');
  };

  const handleNewTemplate = () => {
    // TODO: Implement template creation
    console.log('Creating new template...');
  };

  const handleImportData = () => {
    // TODO: Implement data import
    console.log('Importing data...');
  };

  return (
    <div className="space-y-4">
      {/* Primary Toolbar */}
      <DatabasePrimaryToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        hasActiveFilters={hasActiveFilters}
        hasActiveSorts={hasActiveSorts}
        onFilterClick={() => setShowFilterModal(true)}
        onSortClick={() => setShowSortModal(true)}
        onNewRecord={handleNewRecord}
        onNewTemplate={handleNewTemplate}
        onImportData={handleImportData}
      />

      {/* View Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4">
        {/* View Tabs */}
        <DatabaseViewTabs
          currentView={currentViewType}
          onViewChange={onViewChange}
          className="flex-1"
        />

        {/* Secondary Controls */}
        <div className="flex items-center gap-2">
          {/* Grouping Controls */}
          <DatabaseGroupingControls
            fields={fields}
            groupingFieldId={groupingFieldId}
            onGroupingChange={onGroupingChange}
          />

          {/* More Options */}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
