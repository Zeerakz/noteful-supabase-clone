
import React, { useState, useEffect } from 'react';
import { DatabaseViewType } from './DatabaseViewSelector';
import { DatabaseViewManager } from './DatabaseViewManager';
import { DatabaseViewControls } from './DatabaseViewControls';
import { DatabaseViewRenderer } from './DatabaseViewRenderer';
import { useDatabaseFields } from '@/hooks/useDatabaseFields';
import { useSavedDatabaseViews } from '@/hooks/useSavedDatabaseViews';
import { useComplexFilters } from '@/hooks/useComplexFilters';
import { useSorting } from '@/hooks/useSorting';
import { createEmptyFilterGroup } from '@/utils/filterUtils';

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
    filterGroup,
    setFilterGroup,
    hasActiveFilters,
    clearFilters,
  } = useComplexFilters();

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
        // Convert old format to new format if needed
        if (Array.isArray(parsedFilters)) {
          const newFilterGroup = createEmptyFilterGroup();
          // Could convert old filter rules to new format here if needed
          setFilterGroup(newFilterGroup);
        } else if (parsedFilters && parsedFilters.id) {
          setFilterGroup(parsedFilters);
        } else {
          setFilterGroup(createEmptyFilterGroup());
        }
      } catch {
        setFilterGroup(createEmptyFilterGroup());
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
  }, [currentView, setFilterGroup, setSortRules]);

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
        currentFilters={filterGroup}
        currentSorts={sortRules}
        currentViewType={currentViewType}
        groupingFieldId={groupingFieldId}
      />

      {/* View Controls */}
      <DatabaseViewControls
        fields={fields}
        currentViewType={currentViewType}
        onViewChange={handleViewChange}
        groupingFieldId={groupingFieldId}
        onGroupingChange={handleGroupingChange}
        filterGroup={filterGroup}
        setFilterGroup={setFilterGroup}
        sortRules={sortRules}
        setSortRules={setSortRules}
        hasActiveFilters={hasActiveFilters}
        hasActiveSorts={hasActiveSorts}
        clearFilters={clearFilters}
        clearSorts={clearSorts}
        showFilterModal={showFilterModal}
        setShowFilterModal={setShowFilterModal}
        showSortModal={showSortModal}
        setShowSortModal={setShowSortModal}
      />

      {/* View Renderer */}
      <DatabaseViewRenderer
        currentViewType={currentViewType}
        databaseId={databaseId}
        workspaceId={workspaceId}
        fields={fields}
        filterGroup={filterGroup}
        sortRules={sortRules}
        groupingFieldId={groupingFieldId}
        collapsedGroups={collapsedGroups}
        onToggleGroupCollapse={toggleGroupCollapse}
      />
    </div>
  );
}
