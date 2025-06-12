
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
      
      console.log('useOptimisticPropertyUpdate: Starting mutation', { pageId, fieldId, value });
      
      const { data, error } = await PagePropertyService.upsertPageProperty(
        pageId,
        fieldId,
        value,
        user.id
      );
      
      if (error) throw new Error(error);
      console.log('useOptimisticPropertyUpdate: Mutation successful', data);
      return data;
    },
    onMutate: async ({ pageId, fieldId, value }) => {
      console.log('useOptimisticPropertyUpdate: Starting optimistic update', { pageId, fieldId, value });
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ['database-pages', databaseId] 
      });

      // Get all matching queries
      const allQueries = queryClient.getQueryCache().getAll();
      const databaseQueries = allQueries.filter(query => 
        Array.isArray(query.queryKey) && 
        query.queryKey[0] === 'database-pages' && 
        query.queryKey[1] === databaseId
      );

      console.log('useOptimisticPropertyUpdate: Found queries to update', databaseQueries.length);

      const previousData: Map<string, any> = new Map();

      // Update each matching query
      databaseQueries.forEach(queryCache => {
        const queryKey = queryCache.queryKey;
        const oldData = queryClient.getQueryData(queryKey);
        
        if (oldData) {
          previousData.set(JSON.stringify(queryKey), oldData);
          
          queryClient.setQueryData(queryKey, (old: any) => {
            if (!old?.data) return old;
            
            const updatedData = old.data.map((page: any) => {
              if (page.id === pageId) {
                console.log('useOptimisticPropertyUpdate: Updating page', page.id);
                
                const updatedProperties = page.page_properties ? [...page.page_properties] : [];
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
            });

            return {
              ...old,
              data: updatedData
            };
          });
        }
      });

      return { previousData, queryKeys: databaseQueries.map(q => q.queryKey) };
    },
    onError: (err, variables, context) => {
      console.error('useOptimisticPropertyUpdate: Error occurred', err);
      
      // Rollback optimistic updates
      if (context?.previousData && context?.queryKeys) {
        context.queryKeys.forEach(queryKey => {
          const keyString = JSON.stringify(queryKey);
          const previousValue = context.previousData.get(keyString);
          if (previousValue) {
            queryClient.setQueryData(queryKey, previousValue);
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
      console.log('useOptimisticPropertyUpdate: Update successful', { data });
      
      // Invalidate all database queries to ensure fresh data
      queryClient.invalidateQueries({ 
        queryKey: ['database-pages', databaseId] 
      });

      toast({
        title: "Success", 
        description: "Property updated successfully",
      });
    },
  });
}
