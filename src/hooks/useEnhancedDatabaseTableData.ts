
import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { createMultiLevelGroups } from '@/utils/multiLevelGrouping';
import { useDatabaseFieldManagement } from '@/hooks/database/useDatabaseFieldManagement';
import { useDatabaseDataTransformation } from '@/hooks/database/useDatabaseDataTransformation';
import { useEnhancedPagination } from '@/hooks/database/useEnhancedPagination';
import { useEnhancedDatabaseQuery } from '@/hooks/database/useEnhancedDatabaseQuery';
import { useEnhancedDatabaseMutations } from '@/hooks/database/useEnhancedDatabaseMutations';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';

interface UseEnhancedDatabaseTableDataProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filterGroup: FilterGroup;
  sortRules: SortRule[];
  onFieldsChange?: () => void;
  groupingConfig?: any;
  collapsedGroups?: string[];
  pagination?: {
    enabled: boolean;
    page: number;
    limit: number;
  };
}

export function useEnhancedDatabaseTableData({
  databaseId,
  workspaceId,
  fields: propFields,
  filterGroup,
  sortRules,
  onFieldsChange,
  groupingConfig,
  collapsedGroups = [],
  pagination = { enabled: false, page: 1, limit: 50 }
}: UseEnhancedDatabaseTableDataProps) {
  const { user } = useAuth();
  const { userProfiles } = useUserProfiles(workspaceId);

  // Field management
  const { fieldsToUse, fieldOperations, handleFieldReorder } = useDatabaseFieldManagement({
    databaseId,
    propFields,
    onFieldsChange,
  });

  // Pagination state
  const {
    paginationState,
    updatePaginationFromQuery,
    goToPage,
    nextPage,
    prevPage,
    changeItemsPerPage,
  } = useEnhancedPagination({
    enabled: pagination.enabled,
    initialPage: pagination.page,
    initialLimit: pagination.limit,
  });

  // Enhanced database query
  const {
    queryResult,
    isLoading: pagesLoading,
    error: pagesError,
    refetch: refetchPages,
    queryKey,
  } = useEnhancedDatabaseQuery({
    databaseId,
    fieldsToUse,
    filterGroup,
    sortRules,
    userId: user?.id,
    pagination: pagination.enabled ? {
      enabled: true,
      currentPage: paginationState.currentPage,
      itemsPerPage: paginationState.itemsPerPage,
    } : { enabled: false, currentPage: 1, itemsPerPage: 50 },
  });

  // Update pagination state when query result changes
  updatePaginationFromQuery(queryResult);

  const pages = queryResult?.data || [];
  const error = queryResult?.error || (pagesError as Error)?.message;

  // Data transformation
  const { pagesWithProperties, groupedData, hasGrouping } = useDatabaseDataTransformation({
    pages,
    fieldsToUse,
    groupingConfig,
    collapsedGroups,
  });

  // Mutations
  const {
    handleCreateRow,
    handleDeleteRow,
    handleTitleUpdate,
    handlePropertyUpdate,
  } = useEnhancedDatabaseMutations({
    databaseId,
    workspaceId,
    queryKey,
    pages,
  });

  return {
    userProfiles,
    fieldsToUse,
    fieldOperations,
    pagesWithProperties,
    pagesLoading,
    pagesError: error,
    refetchPages,
    handleCreateRow,
    handleDeleteRow,
    handleTitleUpdate,
    handlePropertyUpdate,
    handleFieldReorder,
    groupedData,
    hasGrouping,
    
    // Enhanced pagination
    pagination: pagination.enabled ? {
      ...paginationState,
      goToPage,
      nextPage,
      prevPage,
      changeItemsPerPage,
    } : null,
  };
}
