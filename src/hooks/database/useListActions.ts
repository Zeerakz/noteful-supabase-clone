
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PageService } from '@/services/pageService';
import { useOptimisticPropertyUpdate } from '@/hooks/useOptimisticPropertyUpdate';

export function useListActions(databaseId: string, workspaceId: string, refetch: () => void) {
  const { user } = useAuth();
  const { toast } = useToast();
  const propertyUpdateMutation = useOptimisticPropertyUpdate(databaseId);

  const handleFieldEdit = (pageId: string, fieldId: string, value: string) => {
    console.log('useListActions: Field edit triggered', { pageId, fieldId, value });
    propertyUpdateMutation.mutate({
      pageId,
      fieldId,
      value
    });
  };

  const handleTitleEdit = async (pageId: string, title: string) => {
    try {
      const { error } = await PageService.updatePage(pageId, { title: title.trim() });
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
      const { data, error } = await PageService.createPage(
        workspaceId,
        user.id,
        { title: 'Untitled', databaseId }
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
