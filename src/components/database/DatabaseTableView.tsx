
import React, { useState, useEffect } from 'react';
import { useDatabaseTableView } from '@/hooks/useDatabaseTableView';
import { DatabaseTableViewContent } from './table/DatabaseTableViewContent';
import { ManagePropertiesModal } from './fields/ManagePropertiesModal';
import { useOptimisticDatabaseFields } from '@/hooks/useOptimisticDatabaseFields';
import { useEnhancedDatabaseFieldOperations } from '@/hooks/useEnhancedDatabaseFieldOperations';
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
  fields: propFields, 
  filterGroup, 
  sortRules,
  setSortRules,
  onFieldsChange
}: DatabaseTableViewProps) {
  const [enablePagination, setEnablePagination] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showManageProperties, setShowManageProperties] = useState(false);

  // Use optimistic fields hook
  const {
    fields: optimisticFields,
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
    onFieldsChange,
  });

  // Use optimistic fields or fallback to props
  const fieldsToUse = optimisticFields.length > 0 ? optimisticFields : propFields;

  // Ensure all fields have the database_id property
  const fieldsWithDatabaseId = fieldsToUse.map(field => ({
    ...field,
    database_id: field.database_id || databaseId
  }));

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

    // Use optimistic field operations
    await fieldOperations.reorderFields(reorderedFields);
  };

  return (
    <>
      <DatabaseTableViewContent
        pagesWithProperties={pagesWithProperties}
        fields={fieldsWithDatabaseId}
        pagesLoading={pagesLoading}
        pagesError={pagesError}
        onCreateRow={handleCreateRow}
        onTitleUpdate={handleTitleUpdate}
        onPropertyUpdate={handlePropertyUpdate}
        onDeleteRow={handleDeleteRow}
        onRefetch={refetchPages}
        onFieldsChange={onFieldsChange}
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
        onFieldUpdate={fieldOperations.updateField}
        onFieldDuplicate={fieldOperations.duplicateField}
        onFieldDelete={fieldOperations.deleteField}
        onFieldCreate={fieldOperations.createField}
      />
    </>
  );
}
