import { useState, useMemo, useCallback } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PageService } from '@/services/pageService';
import { PagePropertyService } from '@/services/pagePropertyService';
import { useFilteredDatabasePagesQuery } from '@/hooks/useFilteredDatabasePagesQuery';
import { useOptimisticDatabaseFields } from '@/hooks/useOptimisticDatabaseFields';
import { useEnhancedDatabaseFieldOperations } from '@/hooks/useEnhancedDatabaseFieldOperations';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { createMultiLevelGroups } from '@/utils/multiLevelGrouping';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { Page } from '@/types/page';

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
  rawPage: Page;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    enabled: !!databaseId
  });

  const pagesWithProperties: PageWithProperties[] = useMemo(() => {
    return pages.map(page => {
      const pageProperties: Record<string, any> = {};
      if (page.page_properties && Array.isArray(page.page_properties)) {
        page.page_properties.forEach((prop) => {
          if (prop.field_id && prop.value !== undefined) {
            pageProperties[prop.field_id] = prop.value || '';
          }
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

  const { mutateAsync: createRowMutation } = useMutation({
    mutationFn: async ({ title = 'Untitled' }: { title?: string }) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await PageService.createPage(workspaceId, user.id, { title, database_id: databaseId });
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "New row created." });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create row.", variant: "destructive" });
    },
  });

  const handleCreateRow = useCallback(async () => {
    await createRowMutation({ title: 'Untitled' });
  }, [createRowMutation]);
  
  const { mutateAsync: deleteRowMutation } = useMutation({
    mutationFn: (pageId: string) => PageService.deletePage(pageId),
    onMutate: async (pageId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => ({
        ...old,
        data: old?.data?.filter((p: Page) => p.id !== pageId) || []
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
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const handleDeleteRow = useCallback(async (pageId: string) => {
    await deleteRowMutation(pageId);
  }, [deleteRowMutation]);

  const { mutateAsync: titleUpdateMutation } = useMutation({
    mutationFn: async ({ pageId, newTitle }: { pageId: string, newTitle: string }) => {
      const page = pages.find(p => p.id === pageId);
      const newProperties = { ...page?.properties, title: newTitle };
      return PageService.updatePage(pageId, { properties: newProperties });
    },
    onMutate: async ({ pageId, newTitle }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => ({
        ...old,
        data: old?.data?.map((p: Page) => p.id === pageId ? { ...p, properties: {...p.properties, title: newTitle}, last_edited_time: new Date().toISOString() } : p) || []
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
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const handleTitleUpdate = useCallback(async (pageId: string, newTitle: string) => {
    await titleUpdateMutation({ pageId, newTitle });
  }, [titleUpdateMutation]);

  const { mutate: propertyUpdateMutation } = useMutation({
    mutationFn: ({ pageId, fieldId, value }: { pageId: string, fieldId: string, value: string }) => {
        if (!user) throw new Error('User not authenticated');
        return PagePropertyService.upsertPageProperty(pageId, fieldId, value, user.id);
    },
    onMutate: async ({ pageId, fieldId, value }) => {
        await queryClient.cancelQueries({ queryKey });
        const previousData = queryClient.getQueryData(queryKey);
        queryClient.setQueryData(queryKey, (old: any) => {
            if (!old?.data) return old;
            return {
                ...old,
                data: old.data.map((page: Page) => {
                    if (page.id !== pageId) return page;
                    const newProperties = [...(page.page_properties || [])];
                    const propIndex = newProperties.findIndex(p => p.field_id === fieldId);
                    if (propIndex > -1) {
                        newProperties[propIndex] = { ...newProperties[propIndex], value };
                    } else {
                        newProperties.push({
                            id: `temp-${Date.now()}`,
                            page_id: pageId,
                            field_id: fieldId,
                            value,
                            created_by: user?.id || '',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        });
                    }
                    return { ...page, page_properties: newProperties, last_edited_time: new Date().toISOString() };
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
        queryClient.invalidateQueries({ queryKey });
    }
  });

  const handlePropertyUpdate = useCallback((pageId: string, fieldId: string, value: string) => {
    propertyUpdateMutation({ pageId, fieldId, value });
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
    pagination: null, // Simplified for now
    totalPages: enablePagination ? Math.ceil(pages.length / itemsPerPage) : 1,
    itemsPerPage,
    handleItemsPerPageChange,
    handleFieldReorder,
    groupedData,
    hasGrouping,
  };
}
