
import React, { useState } from 'react';
import { useDatabaseTableView } from '@/hooks/useDatabaseTableView';
import { DatabaseTableViewContent } from './table/DatabaseTableViewContent';
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

  // Ensure all fields have the database_id property
  const fieldsWithDatabaseId = fields.map(field => ({
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
    enableVirtualScrolling: false // Default to false, can be calculated later if needed
  });

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  return (
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
    />
  );
}
