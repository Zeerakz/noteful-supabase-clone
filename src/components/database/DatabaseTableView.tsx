
import React from 'react';
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
    filterGroup,
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
