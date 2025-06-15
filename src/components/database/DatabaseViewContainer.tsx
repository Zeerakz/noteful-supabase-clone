import React from 'react';
import { DatabaseHeader } from './DatabaseHeader';
import { DatabaseViewRenderer } from './DatabaseViewRenderer';
import { DatabaseUnifiedToolbar } from './DatabaseUnifiedToolbar';
import { BreakingChangesAlert } from './BreakingChangesAlert';
import { Database, DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/hooks/useDatabaseSorting';
import { GroupingConfig } from '@/hooks/useDatabaseViewSelector';
import { DatabaseViewType } from './DatabaseViewRenderer';
import { useBreakingChanges } from '@/hooks/useBreakingChanges';

interface DatabaseViewContainerProps {
  database: Database;
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  currentView: DatabaseViewType;
  filterGroup: FilterGroup;
  sortRules: SortRule[];
  groupingConfig: GroupingConfig;
  collapsedGroups: string[];
  onViewChange: (view: DatabaseViewType) => void;
  onFiltersChange: (filters: FilterGroup) => void;
  onSortsChange: (sorts: SortRule[]) => void;
  onToggleGroupCollapse: (groupKey: string) => void;
  onFieldsReorder: (fields: DatabaseField[]) => Promise<void>;
  onFieldUpdate: (fieldId: string, updates: Partial<DatabaseField>) => Promise<void>;
  onFieldDuplicate: (field: DatabaseField) => Promise<void>;
  onFieldDelete: (fieldId: string) => Promise<void>;
  onFieldCreate: (field: { name: string; type: any; settings?: any }) => Promise<void>;
  onFieldsChange: () => void;
}

export function DatabaseViewContainer({
  database,
  databaseId,
  workspaceId,
  fields,
  currentView,
  filterGroup,
  sortRules,
  groupingConfig,
  collapsedGroups,
  onViewChange,
  onFiltersChange,
  onSortsChange,
  onToggleGroupCollapse,
  onFieldsReorder,
  onFieldUpdate,
  onFieldDuplicate,
  onFieldDelete,
  onFieldCreate,
  onFieldsChange
}: DatabaseViewContainerProps) {
  // Enhanced breaking changes with optimistic updates
  const {
    visibleBreakingChanges,
    categorizedChanges,
    config,
    loadingBreakingChanges,
    handleDismissBreakingChange,
    handleAcknowledgeAllBreakingChanges,
    updateConfig,
    refreshBreakingChanges
  } = useBreakingChanges(databaseId);

  // Handle field operations that might trigger breaking changes refresh
  const handleFieldOperationWithRefresh = async (operation: () => Promise<void>) => {
    await operation();
    // Refresh breaking changes after field operations to catch new changes
    setTimeout(() => refreshBreakingChanges(), 500);
  };

  const wrappedOnFieldDelete = async (fieldId: string) => {
    await handleFieldOperationWithRefresh(() => onFieldDelete(fieldId));
  };

  const wrappedOnFieldUpdate = async (fieldId: string, updates: Partial<DatabaseField>) => {
    await handleFieldOperationWithRefresh(() => onFieldUpdate(fieldId, updates));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Database Header */}
      <DatabaseHeader database={database} />

      {/* Enhanced Breaking Changes Alert with optimistic updates */}
      {!loadingBreakingChanges && visibleBreakingChanges.length > 0 && (
        <div className="p-4 border-b">
          <BreakingChangesAlert
            breakingChanges={visibleBreakingChanges}
            categorizedChanges={categorizedChanges}
            config={config}
            onDismiss={handleDismissBreakingChange}
            onAcknowledgeAll={handleAcknowledgeAllBreakingChanges}
            onConfigUpdate={updateConfig}
          />
        </div>
      )}

      {/* Unified Toolbar */}
      <DatabaseUnifiedToolbar
        currentViewType={currentView}
        onViewChange={onViewChange}
        fields={fields}
        filters={filterGroup}
        sorts={sortRules}
        onFiltersChange={onFiltersChange}
        onSortsChange={onSortsChange}
        databaseId={databaseId}
        workspaceId={workspaceId}
        onFieldsReorder={onFieldsReorder}
        onFieldUpdate={wrappedOnFieldUpdate}
        onFieldDuplicate={onFieldDuplicate}
        onFieldDelete={wrappedOnFieldDelete}
        onFieldCreate={onFieldCreate}
        onShowPropertiesModal={() => {}}
        onShowFilterModal={() => {}}
        onShowSortModal={() => {}}
      />

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <DatabaseViewRenderer
          databaseId={databaseId}
          workspaceId={workspaceId}
          fields={fields}
          currentView={currentView}
          filterGroup={filterGroup}
          sortRules={sortRules}
          setSortRules={onSortsChange}
          groupingConfig={groupingConfig}
          collapsedGroups={collapsedGroups}
          onToggleGroupCollapse={onToggleGroupCollapse}
          onFieldsChange={onFieldsChange}
          onFieldCreate={onFieldCreate}
        />
      </div>
    </div>
  );
}
