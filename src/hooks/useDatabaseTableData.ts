
import { useState, useMemo } from 'react';
import { useDatabaseTableView } from '@/hooks/useDatabaseTableView';
import { useOptimisticDatabaseFields } from '@/hooks/useOptimisticDatabaseFields';
import { useEnhancedDatabaseFieldOperations } from '@/hooks/useEnhancedDatabaseFieldOperations';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { createMultiLevelGroups } from '@/utils/multiLevelGrouping';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';

interface UseDatabaseTableDataProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filterGroup: FilterGroup;
  sortRules: SortRule[];
  onFieldsChange?: () => void;
  groupingConfig?: any;
  collapsedGroups?: string[];
}

export function useDatabaseTableData({
  databaseId, 
  workspaceId, 
  fields: propFields, 
  filterGroup, 
  sortRules,
  onFieldsChange,
  groupingConfig,
  collapsedGroups = []
}: UseDatabaseTableDataProps) {
  const [enablePagination, setEnablePagination] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const { userProfiles } = useUserProfiles(workspaceId);

  const {
    fields: optimisticFields,
    optimisticCreateField,
    optimisticUpdateField,
    optimisticDeleteField,
    optimisticReorderFields,
    revertOptimisticChanges,
  } = useOptimisticDatabaseFields(databaseId, workspaceId);

  const fieldOperations = useEnhancedDatabaseFieldOperations({
    databaseId,
    onOptimisticCreate: optimisticCreateField,
    onOptimisticUpdate: optimisticUpdateField,
    onOptimisticDelete: optimisticDeleteField,
    onOptimisticReorder: optimisticReorderFields,
    onRevert: revertOptimisticChanges,
    onFieldsChange,
  });

  const fieldsToUse = useMemo(() => {
    const fields = optimisticFields.length > 0 ? optimisticFields : propFields;
    return fields.map(field => ({
      ...field,
      database_id: field.database_id || databaseId
    }));
  }, [optimisticFields, propFields, databaseId]);

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
    fields: fieldsToUse,
    sortRules,
    enablePagination,
    itemsPerPage,
    enableVirtualScrolling: false
  });

  const groupedData = useMemo(() => {
    return groupingConfig && groupingConfig.levels.length > 0
      ? createMultiLevelGroups(
          pagesWithProperties,
          fieldsToUse,
          groupingConfig,
          collapsedGroups
        )
      : [];
  }, [pagesWithProperties, fieldsToUse, groupingConfig, collapsedGroups]);
  
  const hasGrouping = groupingConfig && groupingConfig.levels.length > 0;

  const handleFieldReorder = async (draggedFieldId: string, targetFieldId: string, position: 'before' | 'after') => {
    const currentFields = [...fieldsToUse];
    const draggedIndex = currentFields.findIndex(f => f.id === draggedFieldId);
    const targetIndex = currentFields.findIndex(f => f.id === targetFieldId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedField] = currentFields.splice(draggedIndex, 1);
    
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    currentFields.splice(insertIndex, 0, draggedField);

    const reorderedFields = currentFields.map((field, index) => ({
      ...field,
      pos: index
    }));

    await fieldOperations.reorderFields(reorderedFields);
  };
  
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  return {
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
  };
}
