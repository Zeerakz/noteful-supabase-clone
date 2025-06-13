
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { usePages } from '@/hooks/usePages';
import { useToast } from '@/hooks/use-toast';
import { PageTreeItem } from './PageTreeItem';

interface WorkspacePagesGroupProps {
  workspaceId: string;
  workspaceName: string;
}

export function WorkspacePagesGroup({ workspaceId, workspaceName }: WorkspacePagesGroupProps) {
  const { pages, deletePage, createPage, updatePageHierarchy, loading } = usePages(workspaceId);
  const { toast } = useToast();
  const navigate = useNavigate();

  console.log('WorkspacePagesGroup render:', { 
    workspaceId, 
    workspaceName, 
    pagesCount: pages?.length,
    loading 
  });

  const topLevelPages = pages?.filter(page => !page.parent_page_id) || [];

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
    const page = pages?.find(p => p.id === pageId);
    if (!page) return;

    if (!confirm(`Are you sure you want to delete "${page.title}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await deletePage(pageId);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Page deleted successfully!",
      });
    }
  };

  const handleCreatePage = async () => {
    const { data, error } = await createPage('Untitled Page');
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Page created successfully!",
      });
      
      // Navigate to the new page
      if (data) {
        navigate(`/workspace/${workspaceId}/page/${data.id}`);
      }
    }
  };

  if (loading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{workspaceName}</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-2 py-1 text-xs text-muted-foreground">Loading pages...</div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center justify-between">
        <span className="truncate">{workspaceName}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCreatePage}
          className="h-4 w-4 p-0 opacity-70 hover:opacity-100"
          title="New Page"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={`workspace-${workspaceId}`} type="page">
            {(provided) => (
              <SidebarMenu ref={provided.innerRef} {...provided.droppableProps}>
                {topLevelPages.length === 0 ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleCreatePage} className="text-muted-foreground">
                      <Plus className="h-4 w-4" />
                      <span>Create first page</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  topLevelPages.map((page, index) => (
                    <PageTreeItem
                      key={page.id}
                      page={page}
                      pages={pages || []}
                      workspaceId={workspaceId}
                      onDelete={handleDeletePage}
                      index={index}
                    />
                  ))
                )}
                {provided.placeholder}
              </SidebarMenu>
            )}
          </Droppable>
        </DragDropContext>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
