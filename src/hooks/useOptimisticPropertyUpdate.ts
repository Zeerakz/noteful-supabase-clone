
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { PagePropertyService } from '@/services/pagePropertyService';

export function useOptimisticPropertyUpdate(databaseId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ pageId, fieldId, value }: { pageId: string, fieldId: string, value: string }) => {
        if (!user) throw new Error('User not authenticated');
        return PagePropertyService.upsertPageProperty(pageId, fieldId, value, user.id);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['database-pages', databaseId] });
    },
  });
}
