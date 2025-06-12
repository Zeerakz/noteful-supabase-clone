
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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ['database-pages', databaseId] 
      });

      // Snapshot the previous value
      const previousPages = queryClient.getQueryData(['database-pages', databaseId]);

      // Optimistically update the cache
      queryClient.setQueryData(['database-pages', databaseId], (old: any) => {
        if (!old) return old;
        
        return old.map((page: any) => {
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
        });
      });

      // Return context with previous data for rollback
      return { previousPages };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPages) {
        queryClient.setQueryData(['database-pages', databaseId], context.previousPages);
      }
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update property",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      // Update the cache with the actual server response
      queryClient.setQueryData(['database-pages', databaseId], (old: any) => {
        if (!old) return old;
        
        return old.map((page: any) => {
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
        });
      });

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
