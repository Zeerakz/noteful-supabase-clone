
import React, { useState } from 'react';
import { DatabaseViewRenderer } from './DatabaseViewRenderer';
import { DatabaseUnifiedToolbar, DatabaseViewType } from './DatabaseUnifiedToolbar';
import { FilterModal } from './FilterModal';
import { SortingModal } from './SortingModal';
import { ManagePropertiesModal } from './fields/ManagePropertiesModal';
import { useDatabaseView } from '@/hooks/useDatabaseView';
import { useDatabaseFields } from '@/hooks/useDatabaseFields';
import { useComplexFilters } from '@/hooks/useComplexFilters';
import { useSorting } from '@/hooks/useSorting';

interface DatabaseViewProps {
  databaseId: string;
  workspaceId: string;
}

export function DatabaseView({ databaseId, workspaceId }: DatabaseViewProps) {
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Hooks
  const { defaultView, saveDefaultView } = useDatabaseView(databaseId);
  const {
    fields,
    loading: fieldsLoading,
    createField,
    updateField,
    deleteField,
    duplicateField,
    reorderFields
  } = useDatabaseFields(databaseId, workspaceId);
  const { filterGroup, setFilterGroup } = useComplexFilters();
  const { sortRules, setSortRules } = useSorting();

  const handleViewChange = (newView: DatabaseViewType) => {
    saveDefaultView(newView);
  };

  const handleAddRow = () => {
    // This will be implemented by the DatabaseViewRenderer
    console.log('Add row clicked');
  };

  if (fieldsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading database...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Unified Toolbar */}
      <DatabaseUnifiedToolbar
        currentViewType={defaultView}
        onViewChange={handleViewChange}
        fields={fields}
        filters={filterGroup}
        sorts={sortRules}
        onFiltersChange={setFilterGroup}
        onSortsChange={setSortRules}
        databaseId={databaseId}
        workspaceId={workspaceId}
        onAddRow={handleAddRow}
        onFieldsReorder={reorderFields}
        onFieldUpdate={updateField}
        onFieldDuplicate={duplicateField}
        onFieldDelete={deleteField}
        onFieldCreate={createField}
        onShowPropertiesModal={() => setShowPropertiesModal(true)}
        onShowFilterModal={() => setShowFilterModal(true)}
        onShowSortModal={() => setShowSortModal(true)}
      />

      {/* Database Content */}
      <div className="flex-1 min-h-0">
        <DatabaseViewRenderer
          databaseId={databaseId}
          workspaceId={workspaceId}
          viewType={defaultView}
          fields={fields}
          filterGroup={filterGroup}
          sortRules={sortRules}
          setSortRules={setSortRules}
        />
      </div>

      {/* Modals */}
      <ManagePropertiesModal
        open={showPropertiesModal}
        onOpenChange={setShowPropertiesModal}
        fields={fields}
        workspaceId={workspaceId}
        onFieldsReorder={reorderFields}
        onFieldUpdate={updateField}
        onFieldDuplicate={duplicateField}
        onFieldDelete={deleteField}
        onFieldCreate={createField}
      />

      <FilterModal
        open={showFilterModal}
        onOpenChange={setShowFilterModal}
        fields={fields}
        filters={filterGroup}
        onFiltersChange={setFilterGroup}
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
