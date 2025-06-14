
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Page } from '@/hooks/usePages';

interface UsePageTreeItemProps {
  page: Page;
  pages: Page[];
  workspaceId: string;
  onNavigationItemSelect?: () => void;
  onToggleExpanded?: (pageId: string) => void;
  onDelete: (pageId: string) => void;
}

export function usePageTreeItem({
  page,
  pages,
  workspaceId,
  onNavigationItemSelect,
  onToggleExpanded,
  onDelete,
}: UsePageTreeItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const subPages = pages.filter(p => p.parent_page_id === page.id);
  const hasChildren = subPages.length > 0;

  // Improved active state detection
  const isActive = React.useMemo(() => {
    const currentPath = location.pathname;
    const pageRoute = `/workspace/${workspaceId}/page/${page.id}`;
    const workspaceRootRoute = `/workspace/${workspaceId}`;
    
    // Direct page match
    if (currentPath === pageRoute) {
      return true;
    }
    
    // If we're on workspace root, check if this is the first top-level page
    if (currentPath === workspaceRootRoute || currentPath === `${workspaceRootRoute}/`) {
      const topLevelPages = pages.filter(p => !p.parent_page_id);
      const firstTopLevelPage = topLevelPages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0];
      return firstTopLevelPage?.id === page.id;
    }
    
    return false;
  }, [location.pathname, workspaceId, page.id, pages]);

  const handleNavigate = () => {
    navigate(`/workspace/${workspaceId}/page/${page.id}`);
    onNavigationItemSelect?.();
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpanded?.(page.id);
    }
  };

  const handleDelete = () => {
    onDelete(page.id);
  };

  return {
    subPages,
    hasChildren,
    isActive,
    handleNavigate,
    handleToggle,
    handleDelete,
  };
}
