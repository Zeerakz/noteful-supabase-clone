import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createPage, deletePage, updatePage } from '@/services/pageMutationService';
import { PropertyValueService } from '@/services/propertyValueService';
import { EnhancedDatabaseQueryService } from '@/services/database/enhancedDatabaseQueryService';
import { useOptimisticDatabaseFields } from '@/hooks/useOptimisticDatabaseFields';
import { useEnhancedDatabaseFieldOperations } from '@/hooks/useEnhancedDatabaseFieldOperations';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { createMultiLevelGroups } from '@/utils/multiLevelGrouping';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { Block } from '@/types/block';

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

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PageWithProperties {
  id: string;
  title: string;
  workspace_id: string;
  database_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  pos: number;
  properties: Record<string, any>;
  rawPage: Block;
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Pagination state
  const [paginationState, setPaginationState] = useState<PaginationState>({
    currentPage: pagination.page,
    itemsPerPage: pagination.limit,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const { userProfiles } = useUserProfiles(workspaceId);

  const {
    fields: optimisticFields,
    optimisticCreateField,
    optimisticUpdateField,
    optimisticDeleteField,
    optimisticReorderFields,
    revertOptimisticChanges,
  } = useOptimisticDatabaseFields(databaseId);

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

  // Query key for caching
  const queryKey = useMemo(() => [
    'enhanced-database-pages',
    databaseId,
    JSON.stringify(filterGroup),
    JSON.stringify(sortRules),
    pagination.enabled ? paginationState.currentPage : 'all',
    pagination.enabled ? paginationState.itemsPerPage : 'all',
    user?.id || 'no-user'
  ], [databaseId, filterGroup, sortRules, paginationState.currentPage, paginationState.itemsPerPage, pagination.enabled, user?.id]);

  // Enhanced query with server-side pagination
  const {
    data: queryResult,
    isLoading: pagesLoading,
    error: pagesError,
    refetch: refetchPages,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const options = pagination.enabled ? {
        pagination: {
          page: paginationState.currentPage,
          limit: paginationState.itemsPerPage
        },
        enableCounting: true
      } : { enableCounting: false };

      return EnhancedDatabaseQueryService.fetchDatabasePages(
        databaseId,
        filterGroup,
        fieldsToUse,
        sortRules,
        user?.id,
        options
      );
    },
    enabled: !!databaseId && !!user,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update pagination state when query result changes
  useEffect(() => {
    if (queryResult && pagination.enabled) {
      setPaginationState(prev => ({
        ...prev,
        totalItems: queryResult.totalCount || 0,
        totalPages: Math.ceil((queryResult.totalCount || 0) / prev.itemsPerPage),
        hasNextPage: queryResult.hasNextPage || false,
        hasPreviousPage: queryResult.hasPreviousPage || false,
      }));
    }
  }, [queryResult, pagination.enabled]);

  const pages = queryResult?.data || [];
  const error = queryResult?.error || (pagesError as Error)?.message;

  const pagesWithProperties: PageWithProperties[] = useMemo(() => {
    return pages.map(page => {
      const pageProperties: Record<string, any> = {};
      if (page.properties && typeof page.properties === 'object') {
        Object.entries(page.properties).forEach(([key, value]) => {
          pageProperties[key] = value;
        });
      }
      return {
        id: page.id,
        title: (page.properties as any)?.title || '',
        workspace_id: page.workspace_id,
        database_id: (page.properties as any)?.database_id || null,
        created_by: page.created_by || '',
        created_at: page.created_time,
        updated_at: page.last_edited_time,
        parent_id: page.parent_id,
        pos: page.pos,
        properties: pageProperties,
        rawPage: page,
      };
    });
  }, [pages]);

  // Pagination controls
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= paginationState.totalPages) {
      setPaginationState(prev => ({ ...prev, currentPage: page }));
    }
  }, [paginationState.totalPages]);

  const nextPage = useCallback(() => {
    if (paginationState.hasNextPage) {
      goToPage(paginationState.currentPage + 1);
    }
  }, [paginationState.hasNextPage, paginationState.currentPage, goToPage]);

  const prevPage = useCallback(() => {
    if (paginationState.hasPreviousPage) {
      goToPage(paginationState.currentPage - 1);
    }
  }, [paginationState.hasPreviousPage, paginationState.currentPage, goToPage]);

  const changeItemsPerPage = useCallback((newLimit: number) => {
    setPaginationState(prev => ({
      ...prev,
      itemsPerPage: newLimit,
      currentPage: 1, // Reset to first page
      totalPages: Math.ceil(prev.totalItems / newLimit),
    }));
  }, []);

  // Mutations with optimistic updates
  const { mutateAsync: createRowMutation } = useMutation({
    mutationFn: async ({ title = 'Untitled' }: { title?: string }) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await createPage(workspaceId, user.id, { properties: { title, database_id: databaseId } });
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "New row created." });
      queryClient.invalidateQueries({ queryKey: ['enhanced-database-pages', databaseId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create row.", variant: "destructive" });
    },
  });

  const handleCreateRow = useCallback(async () => {
    await createRowMutation({ title: 'Untitled' });
  }, [createRowMutation]);

  // Other mutation handlers remain the same but with updated query invalidation
  const { mutateAsync: deleteRowMutation } = useMutation({
    mutationFn: (pageId: string) => deletePage(pageId),
    onMutate: async (pageId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => ({
        ...old,
        data: old?.data?.filter((p: Block) => p.id !== pageId) || []
      }));
      return { previousData };
    },
    onError: (err, pageId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast({ title: "Error", description: "Failed to delete row.", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-database-pages', databaseId] });
    }
  });

  const handleDeleteRow = useCallback(async (pageId: string) => {
    await deleteRowMutation(pageId);
  }, [deleteRowMutation]);

  const { mutateAsync: titleUpdateMutation } = useMutation({
    mutationFn: async ({ pageId, newTitle }: { pageId: string, newTitle: string }) => {
      const page = pages.find(p => p.id === pageId);
      const newProperties = { ...page?.properties, title: newTitle };
      return updatePage(pageId, { properties: newProperties });
    },
    onMutate: async ({ pageId, newTitle }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => ({
        ...old,
        data: old?.data?.map((p: Block) => p.id === pageId ? { ...p, properties: {...p.properties, title: newTitle}, last_edited_time: new Date().toISOString() } : p) || []
      }));
      return { previousData };
    },
    onError: (err, vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast({ title: "Error", description: "Failed to update title.", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-database-pages', databaseId] });
    }
  });

  const handleTitleUpdate = useCallback(async (pageId: string, newTitle: string) => {
    await titleUpdateMutation({ pageId, newTitle });
  }, [titleUpdateMutation]);

  const { mutate: propertyUpdateMutation } = useMutation({
    mutationFn: ({ pageId, fieldId, value }: { pageId: string, fieldId: string, value: string }) => {
        if (!user) throw new Error('User not authenticated');
        return PropertyValueService.upsertPropertyValue(pageId, fieldId, value, user.id);
    },
    onMutate: async ({ pageId, fieldId, value }) => {
        await queryClient.cancelQueries({ queryKey });
        const previousData = queryClient.getQueryData(queryKey);
        queryClient.setQueryData(queryKey, (old: any) => {
            if (!old?.data) return old;
            return {
                ...old,
                data: old.data.map((page: Block) => {
                    if (page.id !== pageId) return page;
                    const newProperties = { ...page.properties, [fieldId]: value };
                    return { ...page, properties: newProperties, last_edited_time: new Date().toISOString() };
                })
            };
        });
        return { previousData };
    },
    onError: (err, vars, context) => {
        if (context?.previousData) {
            queryClient.setQueryData(queryKey, context.previousData);
        }
        toast({ title: "Error", description: "Failed to update property.", variant: "destructive" });
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['enhanced-database-pages', databaseId] });
    }
  });

  const handlePropertyUpdate = useCallback((pageId: string, propertyId: string, value: string) => {
    propertyUpdateMutation({ pageId, fieldId: propertyId, value });
  }, [propertyUpdateMutation]);

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
