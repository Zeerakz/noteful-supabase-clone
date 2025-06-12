
import React, { useState, useEffect } from 'react';
import { useDatabaseTableView } from '@/hooks/useDatabaseTableView';
import { DatabaseTableViewContent } from './table/DatabaseTableViewContent';
import { ManagePropertiesModal } from './fields/ManagePropertiesModal';
import { useDatabaseFieldOperations } from '@/hooks/useDatabaseFieldOperations';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';

interface DatabaseTableViewProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filterGroup: FilterGroup;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
  onFieldsChange?: () => void;
}

export function DatabaseTableView({ 
  databaseId, 
  workspaceId, 
  fields, 
  filterGroup, 
  sortRules,
  setSortRules,
  onFieldsChange
}: DatabaseTableViewProps) {
  const [enablePagination, setEnablePagination] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showManageProperties, setShowManageProperties] = useState(false);
  const [optimisticFields, setOptimisticFields] = useState<DatabaseField[]>(fields);
  const [refreshKey, setRefreshKey] = useState(0);

  // Update optimistic fields when props change
  useEffect(() => {
    setOptimisticFields(fields);
  }, [fields]);

  // Ensure all fields have the database_id property
  const fieldsWithDatabaseId = optimisticFields.map(field => ({
    ...field,
    database_id: field.database_id || databaseId
  }));

  // Enhanced onFieldsChange that triggers a refresh
  const handleFieldsChange = () => {
    setRefreshKey(prev => prev + 1);
    onFieldsChange?.();
  };

  const fieldOperations = useDatabaseFieldOperations(databaseId, handleFieldsChange);

  const {
    pagesWithProperties,
    pagesLoading,
    pagesError,
    refetchPages,
    handleCreateRow,
    handleDeleteRow,
    handleTitleUpdate,
    handlePropertyUpdate,
    pagination,
    totalPages,
  } = useDatabaseTableView({
    databaseId,
    workspaceId,
    filterGroup,
    fields: fieldsWithDatabaseId,
    sortRules,
    enablePagination,
    itemsPerPage,
    enableVirtualScrolling: false
  });

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  const handleFieldReorder = async (draggedFieldId: string, targetFieldId: string, position: 'before' | 'after') => {
    const currentFields = [...fieldsWithDatabaseId];
    const draggedIndex = currentFields.findIndex(f => f.id === draggedFieldId);
    const targetIndex = currentFields.findIndex(f => f.id === targetFieldId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged field
    const [draggedField] = currentFields.splice(draggedIndex, 1);
    
    // Insert at new position
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    currentFields.splice(insertIndex, 0, draggedField);

    // Update positions
    const reorderedFields = currentFields.map((field, index) => ({
      ...field,
      pos: index
    }));

    // Optimistically update the UI immediately
    setOptimisticFields(reorderedFields);

    try {
      // Update the database
      await fieldOperations.reorderFields(reorderedFields);
      // Trigger refetch to ensure consistency
      handleFieldsChange();
    } catch (error) {
      console.error('Failed to reorder fields:', error);
      // Revert optimistic update on error
      setOptimisticFields(fields);
    }
  };

  // Enhanced field operations with proper refresh handling
  const enhancedFieldOperations = {
    ...fieldOperations,
    createField: async (field: { name: string; type: any; settings?: any }) => {
      try {
        await fieldOperations.createField(field);
        // Force a refresh of the page data to show new property columns
        await refetchPages();
      } catch (error) {
        console.error('Failed to create field:', error);
        throw error;
      }
    },
    deleteField: async (fieldId: string) => {
      try {
        await fieldOperations.deleteField(fieldId);
        // Force a refresh of the page data to remove deleted property columns
        await refetchPages();
      } catch (error) {
        console.error('Failed to delete field:', error);
        throw error;
      }
    },
    updateField: async (fieldId: string, updates: Partial<DatabaseField>) => {
      try {
        await fieldOperations.updateField(fieldId, updates);
        // Force a refresh of the page data to show updated property columns
        await refetchPages();
      } catch (error) {
        console.error('Failed to update field:', error);
        throw error;
      }
    }
  };

  return (
    <>
      <DatabaseTableViewContent
        key={refreshKey} // Force re-render when fields change
        pagesWithProperties={pagesWithProperties}
        fields={fieldsWithDatabaseId}
        pagesLoading={pagesLoading}
        pagesError={pagesError}
        onCreateRow={handleCreateRow}
        onTitleUpdate={handleTitleUpdate}
        onPropertyUpdate={handlePropertyUpdate}
        onDeleteRow={handleDeleteRow}
        onRefetch={refetchPages}
        onFieldsChange={handleFieldsChange}
        onFieldReorder={handleFieldReorder}
        pagination={pagination ? {
          ...pagination,
          totalItems: totalPages,
          itemsPerPage: itemsPerPage,
          prevPage: pagination.previousPage
        } : null}
        totalPages={totalPages}
        databaseId={databaseId}
        sortRules={sortRules}
        setSortRules={setSortRules}
        workspaceId={workspaceId}
        onItemsPerPageChange={handleItemsPerPageChange}
        onShowManageProperties={() => setShowManageProperties(true)}
      />

      <ManagePropertiesModal
        open={showManageProperties}
        onOpenChange={setShowManageProperties}
        fields={fieldsWithDatabaseId}
        onFieldsReorder={fieldOperations.reorderFields}
        onFieldUpdate={enhancedFieldOperations.updateField}
        onFieldDuplicate={fieldOperations.duplicateField}
        onFieldDelete={enhancedFieldOperations.deleteField}
        onFieldCreate={enhancedFieldOperations.createField}
      />
    </>
  );
}
