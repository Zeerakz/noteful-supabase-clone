
import React, { useState, useEffect, useCallback } from 'react';
import { DatabaseViewType } from './DatabaseViewSelector';
import { DatabaseViewManager } from './DatabaseViewManager';
import { DatabaseViewControls } from './DatabaseViewControls';
import { DatabaseViewRenderer } from './DatabaseViewRenderer';
import { ComplexFilterModal } from './filters/ComplexFilterModal';
import { SortingModal } from './SortingModal';
import { useOptimisticDatabaseFields } from '@/hooks/useOptimisticDatabaseFields';
import { useEnhancedDatabaseFieldOperations } from '@/hooks/useEnhancedDatabaseFieldOperations';
import { useSavedDatabaseViews } from '@/hooks/useSavedDatabaseViews';
import { useComplexFilters } from '@/hooks/useComplexFilters';
import { useSorting } from '@/hooks/useSorting';
import { useMultiLevelGrouping } from '@/hooks/useMultiLevelGrouping';
import { createEmptyFilterGroup } from '@/utils/filterUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

interface DatabaseViewProps {
  databaseId: string;
  workspaceId: string;
}

export function DatabaseView({ databaseId, workspaceId }: DatabaseViewProps) {
  const [fieldsRefreshKey, setFieldsRefreshKey] = useState(0);
  const { user } = useAuth();
  
  // Use optimistic fields instead of the regular hook
  const { 
    fields, 
    loading: fieldsLoading, 
    error: fieldsError,
    optimisticCreateField,
    optimisticUpdateField,
    optimisticDeleteField,
    optimisticReorderFields,
    revertOptimisticChanges,
  } = useOptimisticDatabaseFields(databaseId);

  // Enhanced field operations with optimistic updates
  const fieldOperations = useEnhancedDatabaseFieldOperations({
    databaseId,
    onOptimisticCreate: optimisticCreateField,
    onOptimisticUpdate: optimisticUpdateField,
    onOptimisticDelete: optimisticDeleteField,
    onOptimisticReorder: optimisticReorderFields,
    onRevert: revertOptimisticChanges,
    onFieldsChange: () => setFieldsRefreshKey(prev => prev + 1),
  });
  
  const { 
    views,
    currentView,
    setCurrentView,
    loading: viewsLoading,
    error: viewsError,
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

  // Multi-level grouping hook
  const {
    groupingConfig,
    collapsedGroups: multiLevelCollapsedGroups,
    hasGrouping: hasMultiLevelGrouping,
    updateGroupingConfig,
    toggleGroupCollapse,
    clearGrouping
  } = useMultiLevelGrouping({
    maxLevels: 3,
  });

  // Debounce filter and sort changes to avoid excessive saves
  const debouncedFilterGroup = useDebounce(filterGroup, 1000);
  const debouncedSortRules = useDebounce(sortRules, 1000);

  // Auto-save filters and sorts to current view
  const autoSaveViewState = useCallback(async () => {
    if (!currentView || !user) return;
    
    try {
      await updateView(currentView.id, {
        filters: JSON.stringify(debouncedFilterGroup),
        sorts: JSON.stringify(debouncedSortRules),
        grouping_field_id: groupingFieldId,
        grouping_collapsed_groups: collapsedGroups,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to auto-save view state:', error);
    }
  }, [currentView, user, debouncedFilterGroup, debouncedSortRules, groupingFieldId, collapsedGroups, updateView]);

  // Auto-save when filters or sorts change
  useEffect(() => {
    if (currentView && (hasActiveFilters || hasActiveSorts)) {
      autoSaveViewState();
    }
  }, [debouncedFilterGroup, debouncedSortRules, autoSaveViewState, currentView, hasActiveFilters, hasActiveSorts]);

  // Update local state when current view changes
  useEffect(() => {
    if (currentView) {
      setCurrentViewType(currentView.view_type as DatabaseViewType);
      setGroupingFieldId(currentView.grouping_field_id);
      setCollapsedGroups(currentView.grouping_collapsed_groups || []);
      
      try {
        let parsedFilters;
        if (typeof currentView.filters === 'string') {
          parsedFilters = JSON.parse(currentView.filters);
        } else {
          parsedFilters = currentView.filters;
        }
        
        // Convert old format to new format if needed
        if (Array.isArray(parsedFilters)) {
          const newFilterGroup = createEmptyFilterGroup();
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
        let parsedSorts;
        if (typeof currentView.sorts === 'string') {
          parsedSorts = JSON.parse(currentView.sorts);
        } else {
          parsedSorts = currentView.sorts;
        }
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
    
    // Clear multi-level grouping when using simple grouping
    if (fieldId && hasMultiLevelGrouping) {
      clearGrouping();
    }
  };

  const toggleGroupCollapseLegacy = (groupValue: string) => {
    setCollapsedGroups(prev => {
      const isCollapsed = prev.includes(groupValue);
      return isCollapsed
        ? prev.filter(g => g !== groupValue)
        : [...prev, groupValue];
    });
  };

  // Enhanced fields change handler
  const handleFieldsChange = () => {
    setFieldsRefreshKey(prev => prev + 1);
  };

  // Show loading state
  if (fieldsLoading || viewsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading database...</div>
      </div>
    );
  }

  // Show error state for critical errors
  if (fieldsError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Error loading database: {fieldsError}</div>
      </div>
    );
  }

  // Show warning for views error but continue with default view
  const showViewsWarning = viewsError && !viewsError.includes('default view');

  return (
    <div className="space-y-6" key={fieldsRefreshKey}>
      {/* Show warning if views couldn't be loaded */}
      {showViewsWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="text-sm text-yellow-800">
            Warning: {viewsError}
          </div>
        </div>
      )}

      {/* View Manager */}
      <DatabaseViewManager
        views={views}
        currentView={currentView}
        fields={fields}
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

      {/* View Controls with Multi-Level Grouping */}
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
        groupingConfig={groupingConfig}
        onGroupingConfigChange={updateGroupingConfig}
        databaseId={databaseId}
        workspaceId={workspaceId}
        onFieldsReorder={fieldOperations.reorderFields}
        onFieldUpdate={fieldOperations.updateField}
        onFieldDuplicate={fieldOperations.duplicateField}
        onFieldDelete={fieldOperations.deleteField}
        onFieldCreate={fieldOperations.createField}
      />

      {/* View Renderer with Multi-Level Grouping Support */}
      <DatabaseViewRenderer
        currentViewType={currentViewType}
        databaseId={databaseId}
        workspaceId={workspaceId}
        fields={fields}
        filterGroup={filterGroup}
        sortRules={sortRules}
        setSortRules={setSortRules}
        groupingFieldId={groupingFieldId}
        collapsedGroups={hasMultiLevelGrouping ? multiLevelCollapsedGroups : collapsedGroups}
        onToggleGroupCollapse={hasMultiLevelGrouping ? toggleGroupCollapse : toggleGroupCollapseLegacy}
        onFieldsChange={handleFieldsChange}
        groupingConfig={hasMultiLevelGrouping ? groupingConfig : undefined}
        onGroupingConfigChange={hasMultiLevelGrouping ? updateGroupingConfig : undefined}
      />

      {/* Filter Modal */}
      <ComplexFilterModal
        open={showFilterModal}
        onOpenChange={setShowFilterModal}
        fields={fields}
        filterGroup={filterGroup}
        onFilterGroupChange={setFilterGroup}
      />

      {/* Sort Modal */}
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
