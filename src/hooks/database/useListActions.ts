
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createPage, updatePage } from '@/services/pageMutationService';
import { useOptimisticPropertyValueUpdate } from '@/hooks/useOptimisticPropertyValueUpdate';

export function useListActions(databaseId: string, workspaceId: string, refetch: () => void) {
  const { user } = useAuth();
  const { toast } = useToast();
  const propertyUpdateMutation = useOptimisticPropertyValueUpdate(databaseId);

  const handleFieldEdit = (pageId: string, fieldId: string, value: string) => {
    console.log('useListActions: Field edit triggered', { pageId, fieldId, value });
    propertyUpdateMutation.mutate({
      pageId,
      propertyId: fieldId,
      value
    });
  };

  const handleTitleEdit = async (pageId: string, title: string) => {
    try {
      const { error } = await updatePage(pageId, { properties: { title: title.trim() } });
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        refetch();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update title",
        variant: "destructive",
      });
    }
  };

  const handleCreateEntry = async () => {
    if (!user) return;

    try {
      const { data, error } = await createPage(
        workspaceId,
        user.id,
        { properties: { title: 'Untitled', database_id: databaseId } }
      );
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "New entry created",
        });
        refetch();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create entry",
        variant: "destructive",
      });
    }
  };

  return {
    handleFieldEdit,
    handleTitleEdit,
    handleCreateEntry
  };
}
