
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedTreeViewNavigation } from '@/hooks/useEnhancedTreeViewNavigation';
import { useNavigationState } from '@/contexts/NavigationStateContext';
import { PageTreeItem } from './PageTreeItem';
import { validateDragAndDrop } from '@/utils/navigationConstraints';
import { Page } from '@/hooks/usePages';

interface WorkspacePagesGroupProps {
  workspaceId: string;
  workspaceName: string;
  onNavigationItemSelect?: () => void;
}

export function WorkspacePagesGroup({ workspaceId, workspaceName, onNavigationItemSelect }: WorkspacePagesGroupProps) {
  const { pages, updatePageHierarchy, deletePage, hasOptimisticChanges, loading } = useEnhancedPages(workspaceId);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isExpanded, setActiveWorkspace } = useNavigationState();

  // Set active workspace when component mounts
  React.useEffect(() => {
    setActiveWorkspace(workspaceId);
  }, [workspaceId, setActiveWorkspace]);

  const topLevelPages = pages.filter(page => !page.parent_page_id);

  // Convert pages to tree items for keyboard navigation using centralized expansion state
  const treeItems = useMemo(() => {
    const calculateLevel = (page: Page): number => {
      if (!page.parent_page_id) return 0;
      const parent = pages.find(p => p.id === page.parent_page_id);
      return parent ? calculateLevel(parent) + 1 : 0;
    };

    return pages.map(page => ({
      id: page.id,
      parentId: page.parent_page_id,
      hasChildren: pages.some(p => p.parent_page_id === page.id),
      isExpanded: isExpanded(page.id),
      level: calculateLevel(page),
    }));
  }, [pages, isExpanded]);

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
    currentItemId,
    containerRef,
    handleKeyDown,
    focusItem,
    isFocused,
    isCurrent,
  } = useEnhancedTreeViewNavigation({
    items: treeItems,
    onNavigate: handleNavigate,
    onActivate: handleActivate,
  });

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    
    // Parse destination droppable ID to get parent info
    const isTopLevel = destination.droppableId === `workspace-${workspaceId}`;
    const newParentId = isTopLevel ? null : destination.droppableId.replace('sub-', '');
    
    // If dropped in the same position, do nothing
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    console.log('Drag and drop:', { draggableId, source, destination, newParentId });

    // Validate the drag and drop operation against depth constraints
    const validation = validateDragAndDrop(pages, draggableId, newParentId, destination.index);
    
    if (!validation.isValid) {
      toast({
        title: "Cannot move page",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const { error } = await updatePageHierarchy(
      draggableId,
      newParentId,
      destination.index
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
        description: "Page moved successfully!",
      });
    }
  };

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
            <Droppable droppableId={`workspace-${workspaceId}`} type="page">
              {(provided) => (
                <nav aria-label={`${workspaceName} pages navigation`} ref={containerRef}>
                  <ul role="group" aria-label={`${workspaceName} pages`}>
                    <SidebarMenu ref={provided.innerRef} {...provided.droppableProps}>
                      {topLevelPages.length === 0 ? (
                        <SidebarMenuItem>
                          <SidebarMenuButton className="text-muted-foreground" disabled>
                            <span>No pages yet</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ) : (
                        topLevelPages.map((page, index) => (
                          <PageTreeItem
                            key={page.id}
                            page={page}
                            pages={pages}
                            workspaceId={workspaceId}
                            onDelete={handleDeletePage}
                            index={index}
                            focusedItemId={focusedItemId}
                            currentItemId={currentItemId}
                            onKeyDown={handleKeyDown}
                            level={0}
                            onNavigationItemSelect={onNavigationItemSelect}
                            // Pass accessibility state functions
                            isFocused={isFocused}
                            isCurrent={isCurrent}
                          />
                        ))
                      )}
                      {provided.placeholder}
                    </SidebarMenu>
                  </ul>
                </nav>
              )}
            </Droppable>
          </DragDropContext>
        </SidebarGroupContent>
      </SidebarGroup>
    </li>
  );
}
