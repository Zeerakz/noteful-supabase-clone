
import React from 'react';
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
import { PageTreeItem } from './PageTreeItem';
import { validateDragAndDrop } from '@/utils/navigationConstraints';
import { Page } from '@/types/page';

interface WorkspacePagesGroupProps {
  workspaceId: string;
  workspaceName: string;
}

export function WorkspacePagesGroup({ workspaceId, workspaceName }: WorkspacePagesGroupProps) {
  const { pages, updatePageHierarchy, deletePage, hasOptimisticChanges, loading, updatePage } = useEnhancedPages(workspaceId);
  const { toast } = useToast();

  const topLevelPages = pages.filter(page => !page.parent_id);

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

    if (!confirm(`Are you sure you want to delete "${page.properties?.title || 'Untitled'}"? This action cannot be undone.`)) {
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
                        />
                      ))
                    )}
                    {provided.placeholder}
                  </SidebarMenu>
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </SidebarGroupContent>
      </SidebarGroup>
    </li>
  );
}
