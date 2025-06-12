
import React, { useState } from 'react';
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

  // Ensure all fields have the database_id property
  const fieldsWithDatabaseId = fields.map(field => ({
    ...field,
    database_id: field.database_id || databaseId
  }));

  const fieldOperations = useDatabaseFieldOperations(databaseId, onFieldsChange);

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
    const newFields = [...fieldsWithDatabaseId];
    const draggedIndex = newFields.findIndex(f => f.id === draggedFieldId);
    const targetIndex = newFields.findIndex(f => f.id === targetFieldId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged field
    const [draggedField] = newFields.splice(draggedIndex, 1);
    
    // Insert at new position
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    newFields.splice(insertIndex, 0, draggedField);

    // Update positions and save
    const reorderedFields = newFields.map((field, index) => ({
      ...field,
      pos: index
    }));

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
