
import React from 'react';
import { useParams } from 'react-router-dom';
import { useDatabaseViewSelector } from '@/hooks/useDatabaseViewSelector';
import { useDatabaseFields } from '@/hooks/useDatabaseFields';
import { useDatabaseFilters } from '@/hooks/useDatabaseFilters';
import { useDatabaseSorting } from '@/hooks/useDatabaseSorting';
import { useDatabase } from '@/hooks/useDatabase';
import { DatabaseViewContainer } from './DatabaseViewContainer';
import { DatabaseViewLoading } from './DatabaseViewLoading';
import { DatabaseViewError } from './DatabaseViewError';

interface DatabaseViewProps {
  workspaceId: string;
}

export function DatabaseView({ workspaceId }: DatabaseViewProps) {
  const { databaseId } = useParams<{ databaseId: string }>();

  // Get database info
  const { database, loading: databaseLoading, error: databaseError } = useDatabase(databaseId);

  // Get database fields
  const { 
    fields, 
    loading: fieldsLoading, 
    error: fieldsError,
    refetch: refetchFields,
    createField,
    updateField,
    deleteField,
    duplicateField,
    reorderFields
  } = useDatabaseFields(databaseId, workspaceId);

  // View selection state
  const { 
    currentView, 
    setCurrentView,
    groupingConfig,
    collapsedGroups,
    toggleGroupCollapse
  } = useDatabaseViewSelector();

  // Filtering state
  const { filterGroup, updateFilterGroup } = useDatabaseFilters();

  // Sorting state
  const { sortRules, setSortRules } = useDatabaseSorting();

  if (!databaseId || !workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Database not found</p>
      </div>
    );
  }

  if (databaseLoading || fieldsLoading) {
    return <DatabaseViewLoading />;
  }

  if (databaseError || fieldsError) {
    return (
      <DatabaseViewError 
        error={databaseError || fieldsError!}
        message="Error loading database"
      />
    );
  }

  if (!database) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Database not found</p>
      </div>
    );
  }

  return (
    <DatabaseViewContainer
      database={database}
      databaseId={databaseId}
      workspaceId={workspaceId}
      fields={fields}
      currentView={currentView}
      filterGroup={filterGroup}
      sortRules={sortRules}
      groupingConfig={groupingConfig}
      collapsedGroups={collapsedGroups}
      onViewChange={setCurrentView}
      onFiltersChange={updateFilterGroup}
      onSortsChange={setSortRules}
      onToggleGroupCollapse={toggleGroupCollapse}
      onFieldsReorder={reorderFields}
      onFieldUpdate={updateField}
      onFieldDuplicate={duplicateField}
      onFieldDelete={deleteField}
      onFieldCreate={createField}
      onFieldsChange={refetchFields}
    />
  );
}
