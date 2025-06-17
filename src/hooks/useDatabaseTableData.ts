
import { useFilteredDatabasePagesQuery } from '@/hooks/useFilteredDatabasePagesQuery';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useEnhancedDatabaseTableData } from '@/hooks/useEnhancedDatabaseTableData';
import { useDatabaseMutations } from '@/hooks/database/useDatabaseMutations';
import { useDatabaseFieldManagement } from '@/hooks/database/useDatabaseFieldManagement';
import { useDatabaseDataTransformation } from '@/hooks/database/useDatabaseDataTransformation';
import { useDatabasePagination } from '@/hooks/database/useDatabasePagination';
import { 
  UseDatabaseTableDataProps, 
  DatabaseTableDataReturn 
} from '@/hooks/database/types';

export function useDatabaseTableData({
  databaseId,
  workspaceId,
  fields: propFields,
  filterGroup,
  sortRules,
  onFieldsChange,
  groupingConfig,
  collapsedGroups = [],
  enableServerSidePagination = false,
  paginationConfig = { page: 1, limit: 50 }
}: UseDatabaseTableDataProps): DatabaseTableDataReturn {
  // Use enhanced hook if server-side pagination is enabled
  const enhancedResult = useEnhancedDatabaseTableData({
    databaseId,
    workspaceId,
    fields: propFields,
    filterGroup,
    sortRules,
    onFieldsChange,
    groupingConfig,
    collapsedGroups,
    pagination: enableServerSidePagination ? {
      enabled: true,
      page: paginationConfig.page,
      limit: paginationConfig.limit
    } : { enabled: false, page: 1, limit: 50 }
  });

  // Legacy implementation for backward compatibility
  const { userProfiles } = useUserProfiles(workspaceId);

  const { fieldsToUse, fieldOperations, handleFieldReorder } = useDatabaseFieldManagement({
    databaseId,
    propFields,
    onFieldsChange,
  });

  const {
    pages,
    loading: pagesLoading,
    error: pagesError,
    refetch: refetchPages,
    queryKey,
  } = useFilteredDatabasePagesQuery({
    databaseId,
    filterGroup,
    fields: fieldsToUse,
    sortRules,
    enabled: !!databaseId && !enableServerSidePagination
  });

  // If server-side pagination is enabled, use enhanced results
  if (enableServerSidePagination) {
    return {
      ...enhancedResult,
      handleItemsPerPageChange: enhancedResult.pagination?.changeItemsPerPage || (() => {}),
      totalPages: enhancedResult.pagination?.totalPages || 1,
      itemsPerPage: enhancedResult.pagination?.itemsPerPage || 50,
    };
  }

  // Legacy client-side implementation
  const { pagesWithProperties, groupedData, hasGrouping } = useDatabaseDataTransformation({
    pages,
    fieldsToUse,
    groupingConfig,
    collapsedGroups,
  });

  const mutations = useDatabaseMutations({
    databaseId,
    workspaceId,
    queryKey,
    pages,
  });

  const { itemsPerPage, handleItemsPerPageChange } = useDatabasePagination(50);

  return {
    userProfiles,
    fieldsToUse,
    fieldOperations,
    pagesWithProperties,
    pagesLoading,
    pagesError,
    refetchPages,
    ...mutations,
    pagination: null, // Simplified for now
    totalPages: Math.ceil(pages.length / itemsPerPage),
    itemsPerPage,
    handleItemsPerPageChange,
    handleFieldReorder,
    groupedData,
    hasGrouping,
  };
}
