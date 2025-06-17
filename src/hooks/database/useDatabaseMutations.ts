
import { useCallback } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createPage, deletePage, updatePage } from '@/services/pageMutationService';
import { PropertyValueService } from '@/services/propertyValueService';
import { Block } from '@/types/block';

interface UseDatabaseMutationsProps {
  databaseId: string;
  workspaceId: string;
  queryKey: any[];
  pages: Block[];
}

export function useDatabaseMutations({ 
  databaseId, 
  workspaceId, 
  queryKey, 
  pages 
}: UseDatabaseMutationsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutateAsync: createRowMutation } = useMutation({
    mutationFn: async ({ title = 'Untitled' }: { title?: string }) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await createPage(workspaceId, user.id, { properties: { title, database_id: databaseId } });
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
      queryClient.invalidateQueries({ queryKey });
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
        queryClient.invalidateQueries({ queryKey });
    }
  });

  const handlePropertyUpdate = useCallback((pageId: string, propertyId: string, value: string) => {
    propertyUpdateMutation({ pageId, fieldId: propertyId, value });
  }, [propertyUpdateMutation]);

  return {
    handleCreateRow,
    handleDeleteRow,
    handleTitleUpdate,
    handlePropertyUpdate,
  };
}
