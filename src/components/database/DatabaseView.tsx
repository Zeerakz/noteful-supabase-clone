
import React, { useState, useEffect } from 'react';
import { DatabaseViewSelector, DatabaseViewType } from './DatabaseViewSelector';
import { DatabaseGroupingControls } from './DatabaseGroupingControls';
import { DatabaseViewManager } from './DatabaseViewManager';
import { DatabaseTableView } from './DatabaseTableView';
import { DatabaseListView } from './DatabaseListView';
import { DatabaseTimelineView } from './DatabaseTimelineView';
import { DatabaseCalendarView } from './DatabaseCalendarView';
import { DatabaseKanbanView } from './DatabaseKanbanView';
import { DatabaseGalleryView } from './DatabaseGalleryView';
import { DatabaseFormView } from './DatabaseFormView';
import { FilterModal } from './FilterModal';
import { SortingModal } from './SortingModal';
import { useDatabaseFields } from '@/hooks/useDatabaseFields';
import { useSavedDatabaseViews } from '@/hooks/useSavedDatabaseViews';
import { useFilters } from '@/hooks/useFilters';
import { useSorting } from '@/hooks/useSorting';
import { Button } from '@/components/ui/button';
import { Filter, ArrowUpDown, X } from 'lucide-react';

interface DatabaseViewProps {
  databaseId: string;
  workspaceId: string;
}

export function DatabaseView({ databaseId, workspaceId }: DatabaseViewProps) {
  const { fields, loading: fieldsLoading, error: fieldsError } = useDatabaseFields(databaseId);
  const { 
    views,
    currentView,
    setCurrentView,
    loading: viewsLoading,
    createView,
    updateView,
    deleteView,
    duplicateView,
    setDefaultView,
  } = useSavedDatabaseViews(databaseId, workspaceId);
  
  const [currentViewType, setCurrentViewType] = useState<DatabaseViewType>('table');
  const [groupingFieldId, setGroupingFieldId] = useState<string | undefined>();
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
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

  // Update local state when current view changes
  useEffect(() => {
    if (currentView) {
      setCurrentViewType(currentView.view_type as DatabaseViewType);
      setGroupingFieldId(currentView.grouping_field_id);
      setCollapsedGroups(currentView.grouping_collapsed_groups || []);
      
      try {
        const parsedFilters = typeof currentView.filters === 'string' 
          ? JSON.parse(currentView.filters) 
          : currentView.filters;
        setFilters(parsedFilters || []);
      } catch {
        setFilters([]);
      }
      
      try {
        const parsedSorts = typeof currentView.sorts === 'string' 
          ? JSON.parse(currentView.sorts) 
          : currentView.sorts;
        setSortRules(parsedSorts || []);
      } catch {
        setSortRules([]);
      }
    }
  }, [currentView, setFilters, setSortRules]);

  const handleViewChange = (view: DatabaseViewType) => {
    setCurrentViewType(view);
  };

  const handleGroupingChange = (fieldId?: string) => {
    setGroupingFieldId(fieldId);
    setCollapsedGroups([]); // Reset collapsed groups when changing grouping field
  };

  const toggleGroupCollapse = (groupValue: string) => {
    setCollapsedGroups(prev => {
      const isCollapsed = prev.includes(groupValue);
      return isCollapsed
        ? prev.filter(g => g !== groupValue)
        : [...prev, groupValue];
    });
  };

  if (fieldsLoading || viewsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading database...</div>
      </div>
    );
  }

  if (fieldsError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Error loading database: {fieldsError}</div>
      </div>
    );
  }

  const renderView = () => {
    const commonProps = {
      databaseId,
      workspaceId,
      fields,
      filters,
      sortRules,
      groupingFieldId,
      collapsedGroups,
      onToggleGroupCollapse: toggleGroupCollapse,
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
  };

  return (
    <div className="space-y-4">
      {/* View Manager */}
      <DatabaseViewManager
        views={views}
        currentView={currentView}
        onViewSelect={setCurrentView}
        onCreateView={createView}
        onUpdateView={updateView}
        onDeleteView={deleteView}
        onDuplicateView={duplicateView}
        onSetDefaultView={setDefaultView}
        currentFilters={filters}
        currentSorts={sortRules}
        currentViewType={currentViewType}
        groupingFieldId={groupingFieldId}
      />

      <div className="flex items-center justify-between">
        <DatabaseViewSelector
          currentView={currentViewType}
          onViewChange={handleViewChange}
        />

        {currentViewType !== 'form' && (
          <div className="flex items-center gap-4">
            <DatabaseGroupingControls
              fields={fields}
              groupingFieldId={groupingFieldId}
              onGroupingChange={handleGroupingChange}
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
