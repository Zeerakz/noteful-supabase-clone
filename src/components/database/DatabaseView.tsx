import React, { useState } from 'react';
import { DatabaseViewSelector, DatabaseViewType } from './DatabaseViewSelector';
import { DatabaseTableView } from './DatabaseTableView';
import { DatabaseListView } from './DatabaseListView';
import { DatabaseCalendarView } from './DatabaseCalendarView';
import { DatabaseKanbanView } from './DatabaseKanbanView';
import { DatabaseFormView } from './DatabaseFormView';
import { FilterModal } from './FilterModal';
import { SortingModal } from './SortingModal';
import { useDatabaseFields } from '@/hooks/useDatabaseFields';
import { useDatabaseView } from '@/hooks/useDatabaseView';
import { useFilters } from '@/hooks/useFilters';
import { useSorting } from '@/hooks/useSorting';
import { Button } from '@/components/ui/button';
import { Filter, ArrowUpDown, X } from 'lucide-react';

interface DatabaseViewProps {
  databaseId: string;
  workspaceId: string;
}

export function DatabaseView({ databaseId, workspaceId }: DatabaseViewProps) {
  const { fields, loading: fieldsLoading } = useDatabaseFields(databaseId);
  const { defaultView, saveDefaultView } = useDatabaseView(databaseId);
  const [currentView, setCurrentView] = useState<DatabaseViewType>(defaultView);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const {
    filters,
    setFilters,
    hasActiveFilters,
    clearFilters,
  } = useFilters();

  const {
    sortRules,
    setSortRules,
    hasActiveSorts,
    clearSorts,
  } = useSorting();

  const handleViewChange = (view: DatabaseViewType) => {
    setCurrentView(view);
    saveDefaultView(view);
  };

  if (fieldsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading database...</div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'table':
        return (
          <DatabaseTableView
            databaseId={databaseId}
            workspaceId={workspaceId}
          />
        );
      case 'list':
        return (
          <DatabaseListView
            databaseId={databaseId}
            workspaceId={workspaceId}
          />
        );
      case 'calendar':
        return (
          <DatabaseCalendarView
            databaseId={databaseId}
            workspaceId={workspaceId}
          />
        );
      case 'kanban':
        return (
          <DatabaseKanbanView
            databaseId={databaseId}
            workspaceId={workspaceId}
          />
        );
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
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DatabaseViewSelector
          currentView={currentView}
          onViewChange={handleViewChange}
        />

        {currentView !== 'form' && (
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
                  {filters.length}
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
        )}
      </div>

      {renderView()}

      <FilterModal
        open={showFilterModal}
        onOpenChange={setShowFilterModal}
        fields={fields}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <SortingModal
        open={showSortModal}
        onOpenChange={setShowSortModal}
        fields={fields}
        sortRules={sortRules}
        onSortRulesChange={setSortRules}
      />
    </div>
  );
}
