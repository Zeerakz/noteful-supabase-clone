
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
}

export function DatabaseTableView({ 
  databaseId, 
  workspaceId, 
  fields, 
  filterGroup, 
  sortRules 
}: DatabaseTableViewProps) {
  const [enablePagination, setEnablePagination] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(50);

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
    fields,
    sortRules,
    enablePagination,
    itemsPerPage,
    enableVirtualScrolling: totalPages > 100
  });

  return (
    <DatabaseTableViewContent
      pagesWithProperties={pagesWithProperties}
      fields={fields}
      pagesLoading={pagesLoading}
      pagesError={pagesError}
      onCreateRow={handleCreateRow}
      onTitleUpdate={handleTitleUpdate}
      onPropertyUpdate={onPropertyUpdate}
      onDeleteRow={handleDeleteRow}
      onRefetch={refetchPages}
      pagination={pagination}
      totalPages={totalPages}
      databaseId={databaseId}
    />
  );
}
