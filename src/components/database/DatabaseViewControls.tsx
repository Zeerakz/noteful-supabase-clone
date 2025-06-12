
import React from 'react';
import { DatabaseViewSelector, DatabaseViewType } from './DatabaseViewSelector';
import { DatabaseGroupingControls } from './DatabaseGroupingControls';
import { ComplexFilterModal } from './filters/ComplexFilterModal';
import { SortingModal } from './SortingModal';
import { Button } from '@/components/ui/button';
import { Filter, ArrowUpDown, X, Settings } from 'lucide-react';
import { DatabaseField } from '@/types/database';
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
  setSortRules: (sorts: SortRule[]) => void;
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
  filterGroup,
  setFilterGroup,
  sortRules,
  setSortRules,
  hasActiveFilters,
  hasActiveSorts,
  clearFilters,
  clearSorts,
  showFilterModal,
  setShowFilterModal,
  showSortModal,
  setShowSortModal,
}: DatabaseViewControlsProps) {
  const filterCount = countFilters(filterGroup);

  return (
    <>
      <div className="flex items-center justify-between">
        <DatabaseViewSelector
          currentView={currentViewType}
          onViewChange={onViewChange}
        />

        {currentViewType !== 'form' && (
          <div className="flex items-center gap-4">
            <DatabaseGroupingControls
              fields={fields}
              groupingFieldId={groupingFieldId}
              onGroupingChange={onGroupingChange}
            />

            <div className="flex items-center gap-2">
              {(hasActiveFilters || hasActiveSorts) && (
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="gap-2"
                    >
                      <X className="h-3 w-3" />
                      Clear Filters
                    </Button>
                  )}
                  {hasActiveSorts && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSorts}
                      className="gap-2"
                    >
                      <X className="h-3 w-3" />
                      Clear Sorts
                    </Button>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterModal(true)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filter
                {hasActiveFilters && (
                  <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {filterCount}
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSortModal(true)}
                className="gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                Sort
                {hasActiveSorts && (
                  <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {sortRules.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ComplexFilterModal
        open={showFilterModal}
        onOpenChange={setShowFilterModal}
        fields={fields}
        filterGroup={filterGroup}
        onFilterGroupChange={setFilterGroup}
      />

      <SortingModal
        open={showSortModal}
        onOpenChange={setShowSortModal}
        fields={fields}
        sortRules={sortRules}
        onSortRulesChange={setSortRules}
      />
    </>
  );
}

function countFilters(group: FilterGroup): number {
  return group.rules.length + group.groups.reduce((count, subGroup) => count + countFilters(subGroup), 0);
}
