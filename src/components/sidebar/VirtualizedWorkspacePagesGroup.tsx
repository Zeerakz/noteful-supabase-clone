
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { DragDropContext } from 'react-beautiful-dnd';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useTreeViewKeyboardNavigation } from '@/hooks/useTreeViewKeyboardNavigation';
import { usePagesExpansion } from '@/hooks/usePagesExpansion';
import { useVirtualizedPages } from '@/hooks/useVirtualizedPages';
import { usePagesDragDrop } from '@/hooks/usePagesDragDrop';
import { VirtualizedPagesList } from './VirtualizedPagesList';

interface VirtualizedWorkspacePagesGroupProps {
  workspaceId: string;
  workspaceName: string;
  onNavigationItemSelect?: () => void;
}

export function VirtualizedWorkspacePagesGroup({ 
  workspaceId, 
  workspaceName, 
  onNavigationItemSelect 
}: VirtualizedWorkspacePagesGroupProps) {
  const { pages, updatePageHierarchy, deletePage, hasOptimisticChanges, loading } = useEnhancedPages(workspaceId);
  const navigate = useNavigate();

  const { expandedPages, handleToggleExpanded } = usePagesExpansion(pages);
  const { flattenedPages, treeItems } = useVirtualizedPages(pages, expandedPages);
  const { handleDragEnd } = usePagesDragDrop({ workspaceId, pages, updatePageHierarchy });

  // Keyboard navigation handlers
  const handleNavigate = (pageId: string) => {
    navigate(`/workspace/${workspaceId}/page/${pageId}`);
    onNavigationItemSelect?.();
  };

  const handleActivate = (pageId: string) => {
    navigate(`/workspace/${workspaceId}/page/${pageId}`);
    onNavigationItemSelect?.();
  };

  const {
    focusedItemId,
    containerRef,
    handleKeyDown,
  } = useTreeViewKeyboardNavigation({
    items: treeItems,
    onNavigate: handleNavigate,
    onToggleExpanded: handleToggleExpanded,
    onActivate: handleActivate,
  });

  const handleDeletePage = async (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    if (!confirm(`Are you sure you want to delete "${page.title}"? This action cannot be undone.`)) {
      return;
    }

    await deletePage(pageId);
  };

  if (loading) {
    return (
      <li role="treeitem" aria-expanded="false">
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span className="truncate flex items-center gap-2">
              {workspaceName}
              <Loader2 className="h-3 w-3 animate-spin" />
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton disabled className="text-muted-foreground">
                  Loading pages...
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </li>
    );
  }

  return (
    <li role="treeitem" aria-expanded="true">
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center justify-between">
          <span className="truncate flex items-center gap-2">
            {workspaceName}
            {hasOptimisticChanges && (
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Syncing changes..." />
            )}
          </span>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <nav aria-label={`${workspaceName} pages navigation`} ref={containerRef}>
              <ul role="group" aria-label={`${workspaceName} pages`}>
                {flattenedPages.length === 0 ? (
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton className="text-muted-foreground" disabled>
                        <span>No pages yet</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                ) : (
                  <VirtualizedPagesList
                    workspaceId={workspaceId}
                    flattenedPages={flattenedPages}
                    pages={pages}
                    expandedPages={expandedPages}
                    focusedItemId={focusedItemId}
                    onKeyDown={handleKeyDown}
                    onToggleExpanded={handleToggleExpanded}
                    onDeletePage={handleDeletePage}
                    onNavigationItemSelect={onNavigationItemSelect}
                  />
                )}
              </ul>
            </nav>
          </DragDropContext>
        </SidebarGroupContent>
      </SidebarGroup>
    </li>
  );
}
