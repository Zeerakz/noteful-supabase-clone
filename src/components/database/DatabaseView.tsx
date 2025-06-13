
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDatabaseViewSelector } from '@/hooks/useDatabaseViewSelector';
import { useDatabaseFields } from '@/hooks/useDatabaseFields';
import { useDatabaseFilters } from '@/hooks/useDatabaseFilters';
import { useDatabaseSorting } from '@/hooks/useDatabaseSorting';
import { useDatabaseViews } from '@/hooks/useDatabaseViews';
import { useDatabase } from '@/hooks/useDatabase';
import { DatabaseHeader } from './DatabaseHeader';
import { DatabaseViewRenderer } from './DatabaseViewRenderer';
import { DatabaseUnifiedToolbar } from './DatabaseUnifiedToolbar';
import { BreakingChangesAlert } from './BreakingChangesAlert';
import { SchemaAuditService } from '@/services/schemaAuditService';
import { BreakingChange } from '@/types/schemaAudit';
import { Skeleton } from '@/components/ui/skeleton';

interface DatabaseViewProps {
  workspaceId: string;
}

export function DatabaseView({ workspaceId }: DatabaseViewProps) {
  const { databaseId } = useParams<{ databaseId: string }>();

  const [breakingChanges, setBreakingChanges] = useState<BreakingChange[]>([]);
  const [loadingBreakingChanges, setLoadingBreakingChanges] = useState(true);

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
  } = useDatabaseFields(databaseId!, workspaceId);

  // Get database views
  const { views, createView, updateView, deleteView } = useDatabaseViews(databaseId!);

  // View selection state
  const { 
    currentView, 
    setCurrentView,
    groupingConfig,
    setGroupingConfig,
    collapsedGroups,
    toggleGroupCollapse
  } = useDatabaseViewSelector();

  // Filtering state
  const { filterGroup, updateFilterGroup } = useDatabaseFilters();

  // Sorting state
  const { sortRules, setSortRules } = useDatabaseSorting();

  // Load breaking changes
  useEffect(() => {
    const loadBreakingChanges = async () => {
      if (!databaseId) return;
      
      setLoadingBreakingChanges(true);
      try {
        // Get breaking changes from the last 7 days
        const since = new Date();
        since.setDate(since.getDate() - 7);
        
        const { data, error } = await SchemaAuditService.getBreakingChangesSince(databaseId, since);
        
        if (error) {
          console.error('Failed to load breaking changes:', error);
        } else {
          setBreakingChanges(data || []);
        }
      } catch (err) {
        console.error('Error loading breaking changes:', err);
      } finally {
        setLoadingBreakingChanges(false);
      }
    };

    loadBreakingChanges();
  }, [databaseId]);

  const handleDismissBreakingChange = (changeId: string) => {
    setBreakingChanges(prev => prev.filter(change => change.id !== changeId));
  };

  const handleAcknowledgeAllBreakingChanges = () => {
    setBreakingChanges([]);
  };

  if (!databaseId || !workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Database not found</p>
      </div>
    );
  }

  if (databaseLoading || fieldsLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (databaseError || fieldsError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading database</p>
          <p className="text-muted-foreground text-sm">
            {databaseError || fieldsError}
          </p>
        </div>
      </div>
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
    <div className="flex flex-col h-full bg-background">
      {/* Database Header */}
      <DatabaseHeader
        database={database}
      />

      {/* Breaking Changes Alert */}
      {!loadingBreakingChanges && breakingChanges.length > 0 && (
        <div className="px-6 py-4">
          <BreakingChangesAlert
            breakingChanges={breakingChanges}
            onDismiss={handleDismissBreakingChange}
            onAcknowledgeAll={handleAcknowledgeAllBreakingChanges}
          />
        </div>
      )}

      {/* Unified Toolbar */}
      <DatabaseUnifiedToolbar
        currentViewType={currentView}
        onViewChange={setCurrentView}
        fields={fields}
        filters={filterGroup}
        sorts={sortRules}
        onFiltersChange={updateFilterGroup}
        onSortsChange={setSortRules}
        databaseId={databaseId}
        workspaceId={workspaceId}
        onFieldsReorder={reorderFields}
        onFieldUpdate={updateField}
        onFieldDuplicate={duplicateField}
        onFieldDelete={deleteField}
        onFieldCreate={createField}
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
          setSortRules={setSortRules}
          groupingConfig={groupingConfig}
          collapsedGroups={collapsedGroups}
          onToggleGroupCollapse={toggleGroupCollapse}
          onFieldsChange={refetchFields}
        />
      </div>
    </div>
  );
}
