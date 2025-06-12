
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PageService } from '@/services/pageService';

export function useGalleryActions(workspaceId: string, databaseId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreateEntry = async (refetch: () => void) => {
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

  const handlePageEdit = (pageId: string) => {
    navigate(`/workspace/${workspaceId}/page/${pageId}`);
  };

  const handlePageView = (pageId: string) => {
    navigate(`/workspace/${workspaceId}/page/${pageId}`);
  };

  const handlePageDelete = async (pageId: string, refetch: () => void) => {
    try {
      const { error } = await PageService.deletePage(pageId);
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Entry deleted",
        });
        refetch();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      });
    }
  };

  return {
    handleCreateEntry,
    handlePageEdit,
    handlePageView,
    handlePageDelete
  };
}
