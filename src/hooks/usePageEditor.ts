
import { useParams, useNavigate } from 'react-router-dom';
import { usePageData } from '@/hooks/usePageData';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePresence } from '@/hooks/usePresence';
import { useEnhancedBlocks } from '@/hooks/useEnhancedBlocks';
import { useBlockPermissions } from '@/hooks/useBlockPermissions';

export function usePageEditor() {
  const { workspaceId, pageId } = useParams<{ workspaceId: string; pageId: string }>();
  const navigate = useNavigate();

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
    if (!pageData) return { error: 'Page not found' };
    
    const newProperties = { ...pageData.properties, title };
    const { error } = await updatePage(pageData.id, { properties: newProperties });
    
    return { error: error || undefined };
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
