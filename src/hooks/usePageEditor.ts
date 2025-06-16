
import { useParams, useNavigate } from 'react-router-dom';
import { usePageData } from '@/hooks/usePageData';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePresence } from '@/hooks/usePresence';
import { useEnhancedBlocks } from '@/hooks/useEnhancedBlocks';
import { useBlockPermissions } from '@/hooks/useBlockPermissions';
import { useToast } from '@/hooks/use-toast';

export function usePageEditor() {
  const { workspaceId, pageId } = useParams<{ workspaceId: string; pageId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize all hooks
  const { pageData, loading: pageLoading, error: pageError } = usePageData(pageId);
  const { workspaces, loading: workspacesLoading } = useWorkspaces();
  const { activeUsers, loading: presenceLoading } = usePresence(pageId);
  const { blocks, hasOptimisticChanges: hasBlockChanges } = useEnhancedBlocks(pageId, workspaceId);
  const { updatePage, hasOptimisticChanges: hasPageChanges } = useEnhancedPages(workspaceId);
  const { permissions, loading: permissionsLoading } = useBlockPermissions(pageId);

  const handleBack = () => {
    navigate(`/workspace/${workspaceId}`);
  };

  const handleTitleUpdate = async (title: string) => {
    if (!pageData) {
      const errorMessage = 'Page not found';
      toast({
        title: "Error",
        description: "Cannot update title. Page not found.",
        variant: "destructive",
      });
      return { error: errorMessage };
    }
    
    if (!title.trim()) {
      const errorMessage = 'Page title cannot be empty';
      toast({
        title: "Error",
        description: "Page title cannot be empty.",
        variant: "destructive",
      });
      return { error: errorMessage };
    }

    try {
      const newProperties = { ...pageData.properties, title: title.trim() };
      const { error } = await updatePage(pageData.id, { properties: newProperties });
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update page title. Please try again.",
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Success",
        description: "Page title updated successfully.",
      });

      return { error: undefined };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update page title';
      console.error('Unexpected error updating page title:', err);
      
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the page title.",
        variant: "destructive",
      });
      
      return { error: errorMessage };
    }
  };

  const hasAnyOptimisticChanges = hasPageChanges || hasBlockChanges;

  return {
    // Route params
    workspaceId,
    pageId,
    // Navigation
    handleBack,
    // Page data
    pageData,
    pageLoading,
    pageError,
    // Loading states
    workspacesLoading,
    permissionsLoading,
    presenceLoading,
    // Data
    workspace: pageData?.workspace,
    blocks,
    activeUsers,
    permissions,
    // State
    hasAnyOptimisticChanges,
    // Actions
    handleTitleUpdate,
  };
}
