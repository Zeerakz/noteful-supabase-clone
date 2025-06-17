
import React, { useState } from 'react';
import { useDatabaseTableData } from '@/hooks/useDatabaseTableData';
import { DatabaseTableViewContent } from './table/DatabaseTableViewContent';
import { GroupedTableView } from './grouping/GroupedTableView';
import { ManagePropertiesModal } from './fields/ManagePropertiesModal';
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
  groupingConfig?: any;
  onGroupingConfigChange?: (config: any) => void;
  collapsedGroups?: string[];
  onToggleGroupCollapse?: (groupKey: string) => void;
  enableServerSidePagination?: boolean;
  paginationConfig?: {
    page: number;
    limit: number;
  };
}

export function DatabaseTableView({ 
  databaseId, 
  workspaceId, 
  fields: propFields, 
  filterGroup, 
  sortRules,
  setSortRules,
  onFieldsChange,
  groupingConfig,
  onGroupingConfigChange,
  collapsedGroups = [],
  onToggleGroupCollapse,
  enableServerSidePagination = false,
  paginationConfig = { page: 1, limit: 50 }
}: DatabaseTableViewProps) {
  const [showManageProperties, setShowManageProperties] = useState(false);

  const {
    userProfiles,
    fieldsToUse,
    fieldOperations,
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
    itemsPerPage,
    handleItemsPerPageChange,
    handleFieldReorder,
    groupedData,
    hasGrouping,
  } = useDatabaseTableData({
    databaseId,
    workspaceId,
    fields: propFields,
    filterGroup,
    sortRules,
    onFieldsChange,
    groupingConfig,
    collapsedGroups,
    enableServerSidePagination,
    paginationConfig,
  });

  if (hasGrouping && groupedData.length > 0) {
    return (
      <>
        <GroupedTableView
          groups={groupedData}
          fields={fieldsToUse}
          onToggleGroupCollapse={onToggleGroupCollapse || (() => {})}
          onTitleUpdate={handleTitleUpdate}
          onPropertyUpdate={handlePropertyUpdate}
          workspaceId={workspaceId}
          getColumnWidth={() => 200} // Simplified, consider passing down resizing hooks if needed
          userProfiles={userProfiles}
          allFields={fieldsToUse}
        />

        <ManagePropertiesModal
          open={showManageProperties}
          onOpenChange={setShowManageProperties}
          fields={fieldsToUse}
          workspaceId={workspaceId}
          onFieldsReorder={fieldOperations.reorderFields}
          onFieldUpdate={fieldOperations.updateField}
          onFieldDuplicate={fieldOperations.duplicateField}
          onFieldDelete={fieldOperations.deleteField}
          onFieldCreate={fieldOperations.createField}
        />
      </>
    );
  }

  return (
    <>
      <DatabaseTableViewContent
        pagesWithProperties={pagesWithProperties}
        fields={fieldsToUse}
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
          totalItems: pagination.totalItems,
          currentPage: pagination.currentPage,
          itemsPerPage: pagination.itemsPerPage,
          totalPages: pagination.totalPages,
          nextPage: pagination.nextPage,
          prevPage: pagination.prevPage,
          goToPage: pagination.goToPage,
        } : null}
        totalPages={totalPages}
        databaseId={databaseId}
        sortRules={sortRules}
        setSortRules={setSortRules}
        workspaceId={workspaceId}
        onItemsPerPageChange={pagination?.changeItemsPerPage || handleItemsPerPageChange}
        onShowManageProperties={() => setShowManageProperties(true)}
        userProfiles={userProfiles}
        allFields={fieldsToUse}
      />

      <ManagePropertiesModal
        open={showManageProperties}
        onOpenChange={setShowManageProperties}
        fields={fieldsToUse}
        workspaceId={workspaceId}
        onFieldsReorder={fieldOperations.reorderFields}
        onFieldUpdate={fieldOperations.updateField}
        onFieldDuplicate={fieldOperations.duplicateField}
        onFieldDelete={fieldOperations.deleteField}
        onFieldCreate={fieldOperations.createField}
      />
    </>
  );
}
