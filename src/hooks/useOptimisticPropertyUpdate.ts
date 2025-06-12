
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
            
            if (existingIndex >= 0) {
              updatedProperties[existingIndex] = {
                ...updatedProperties[existingIndex],
                value
              };
            } else {
              updatedProperties.push({
                page_id: pageId,
                field_id: fieldId,
                value,
                id: `temp-${Date.now()}`, // Temporary ID for optimistic update
              });
            }
            
            return {
              ...page,
              page_properties: updatedProperties
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
    onSuccess: () => {
      // Optionally show success message
      toast({
        title: "Success",
        description: "Property updated successfully",
      });
    },
    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ 
        queryKey: ['database-pages', databaseId] 
      });
    },
  });
}
