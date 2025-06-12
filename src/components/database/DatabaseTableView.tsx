
import React from 'react';
import { useDatabaseTableView } from '@/hooks/useDatabaseTableView';
import { DatabaseTableViewContent } from './table/DatabaseTableViewContent';
import { DatabaseField } from '@/types/database';
import { FilterRule } from '@/components/database/FilterModal';
import { SortRule } from '@/components/database/SortingModal';

interface DatabaseTableViewProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filters: FilterRule[];
  sortRules: SortRule[];
}

export function DatabaseTableView({ 
  databaseId, 
  workspaceId, 
  fields, 
  filters, 
  sortRules 
}: DatabaseTableViewProps) {
  const {
    pagesWithProperties,
    pagesLoading,
    pagesError,
    refetchPages,
    handleCreateRow,
    handleDeleteRow,
    handleTitleUpdate,
    handlePropertyUpdate,
  } = useDatabaseTableView({
    databaseId,
    workspaceId,
    filters,
    fields,
    sortRules
  });

  return (
    <DatabaseTableViewContent
      pagesWithProperties={pagesWithProperties}
      fields={fields}
      pagesLoading={pagesLoading}
      pagesError={pagesError}
      onCreateRow={handleCreateRow}
      onTitleUpdate={handleTitleUpdate}
      onPropertyUpdate={handlePropertyUpdate}
      onDeleteRow={handleDeleteRow}
      onRefetch={refetchPages}
    />
  );
}
