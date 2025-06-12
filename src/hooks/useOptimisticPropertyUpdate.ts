
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { PagePropertyService } from '@/services/pagePropertyService';
import { toast } from '@/hooks/use-toast';

interface PropertyUpdateData {
  pageId: string;
  fieldId: string;
  value: string;
}

export function useOptimisticPropertyUpdate(databaseId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pageId, fieldId, value }: PropertyUpdateData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await PagePropertyService.upsertPageProperty(
        pageId,
        fieldId,
        value,
        user.id
      );
      
      if (error) throw new Error(error);
      return data;
    },
    onMutate: async ({ pageId, fieldId, value }) => {
      console.log('useOptimisticPropertyUpdate: Starting optimistic update', { pageId, fieldId, value });
      
      // Cancel any outgoing refetches for this database
      await queryClient.cancelQueries({ 
        queryKey: ['database-pages', databaseId] 
      });

      // Get all queries that match this database
      const queryKeys = queryClient.getQueryCache()
        .findAll({ queryKey: ['database-pages', databaseId] })
        .map(query => query.queryKey);

      const previousData: Record<string, any> = {};

      // Update all matching queries
      queryKeys.forEach(queryKey => {
        const oldData = queryClient.getQueryData(queryKey);
        previousData[JSON.stringify(queryKey)] = oldData;

        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old?.data) return old;
          
          return {
            ...old,
            data: old.data.map((page: any) => {
              if (page.id === pageId) {
                const updatedProperties = page.page_properties ? [...page.page_properties] : [];
                
                // Find existing property or create new one
                const existingIndex = updatedProperties.findIndex(
                  (prop: any) => prop.field_id === fieldId
                );
                
                const propertyUpdate = {
                  page_id: pageId,
                  field_id: fieldId,
                  value,
                  id: existingIndex >= 0 ? updatedProperties[existingIndex].id : `temp-${Date.now()}`,
                  created_by: user?.id,
                  created_at: existingIndex >= 0 ? updatedProperties[existingIndex].created_at : new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                
                if (existingIndex >= 0) {
                  updatedProperties[existingIndex] = propertyUpdate;
                } else {
                  updatedProperties.push(propertyUpdate);
                }
                
                return {
                  ...page,
                  page_properties: updatedProperties,
                  updated_at: new Date().toISOString(),
                };
              }
              return page;
            })
          };
        });
      });

      // Return context with previous data for rollback
      return { previousData, queryKeys };
    },
    onError: (err, variables, context) => {
      console.error('useOptimisticPropertyUpdate: Error occurred', err);
      
      // Rollback all affected queries
      if (context?.previousData && context?.queryKeys) {
        context.queryKeys.forEach(queryKey => {
          const keyString = JSON.stringify(queryKey);
          if (context.previousData[keyString]) {
            queryClient.setQueryData(queryKey, context.previousData[keyString]);
          }
        });
      }
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update property",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables, context) => {
      console.log('useOptimisticPropertyUpdate: Update successful', { data, variables });
      
      // Update all affected queries with the actual server response
      if (context?.queryKeys) {
        context.queryKeys.forEach(queryKey => {
          queryClient.setQueryData(queryKey, (old: any) => {
            if (!old?.data) return old;
            
            return {
              ...old,
              data: old.data.map((page: any) => {
                if (page.id === variables.pageId) {
                  const updatedProperties = page.page_properties ? [...page.page_properties] : [];
                  
                  // Find and update the property with server data
                  const existingIndex = updatedProperties.findIndex(
                    (prop: any) => prop.field_id === variables.fieldId
                  );
                  
                  if (existingIndex >= 0) {
                    updatedProperties[existingIndex] = data;
                  } else {
                    updatedProperties.push(data);
                  }
                  
                  return {
                    ...page,
                    page_properties: updatedProperties,
                    updated_at: new Date().toISOString(),
                  };
                }
                return page;
              })
            };
          });
        });
      }

      toast({
        title: "Success", 
        description: "Property updated successfully",
      });
    },
    onSettled: () => {
      // Force refetch to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: ['database-pages', databaseId] 
      });
    },
  });
}
