
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyValueService } from '@/services/propertyValueService';

export function useOptimisticPropertyValueUpdate(databaseId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ pageId, propertyId, value }: { pageId: string, propertyId: string, value: string }) => {
        if (!user) throw new Error('User not authenticated');
        return PropertyValueService.upsertPropertyValue(pageId, propertyId, value, user.id);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['database-pages', databaseId] });
    },
  });
}
