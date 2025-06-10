
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, ChevronDown, Plus, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { usePages, Page } from '@/hooks/usePages';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PageTreeItemProps {
  page: Page;
  pages: Page[];
  workspaceId: string;
  onDelete: (pageId: string) => void;
  level?: number;
}

function PageTreeItem({ page, pages, workspaceId, onDelete, level = 0 }: PageTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const childPages = pages.filter(p => p.parent_page_id === page.id);
  const hasChildren = childPages.length > 0;
  const isOwner = page.created_by === user?.id;

  const handleNavigate = () => {
    navigate(`/workspace/${workspaceId}/page/${page.id}`);
  };

  if (level === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton onClick={handleNavigate} className="group">
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="h-4 w-4 p-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            ) : (
              <FileText className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="truncate">{page.title}</span>
          </div>
        </SidebarMenuButton>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction showOnHover>
                <MoreHorizontal />
                <span className="sr-only">More</span>
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
              <DropdownMenuItem onClick={handleNavigate}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(page.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {isExpanded && hasChildren && (
          <SidebarMenuSub>
            {childPages.map((childPage) => (
              <PageTreeItem
                key={childPage.id}
                page={childPage}
                pages={pages}
                workspaceId={workspaceId}
                onDelete={onDelete}
                level={level + 1}
              />
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton onClick={handleNavigate} className="group">
        <div className="flex items-center gap-2 w-full">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="h-3 w-3 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-2 w-2" />
              ) : (
                <ChevronRight className="h-2 w-2" />
              )}
            </Button>
          ) : (
            <FileText className="h-3 w-3 text-muted-foreground" />
          )}
          <span className="truncate flex-1">{page.title}</span>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <DropdownMenuItem onClick={handleNavigate}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(page.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </SidebarMenuSubButton>
      {isExpanded && hasChildren && (
        <SidebarMenuSub>
          {childPages.map((childPage) => (
            <PageTreeItem
              key={childPage.id}
              page={childPage}
              pages={pages}
              workspaceId={workspaceId}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuSubItem>
  );
}

interface WorkspacePagesGroupProps {
  workspaceId: string;
  workspaceName: string;
}

function WorkspacePagesGroup({ workspaceId, workspaceName }: WorkspacePagesGroupProps) {
  const { pages, deletePage } = usePages(workspaceId);
  const { toast } = useToast();
  const navigate = useNavigate();

  const topLevelPages = pages.filter(page => !page.parent_page_id);

  const handleDeletePage = async (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
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

  const handleCreatePage = () => {
    navigate(`/workspace/${workspaceId}`);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center justify-between">
        <span className="truncate">{workspaceName}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCreatePage}
          className="h-4 w-4 p-0 opacity-70 hover:opacity-100"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {topLevelPages.length === 0 ? (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleCreatePage} className="text-muted-foreground">
                <Plus className="h-4 w-4" />
                <span>Create first page</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            topLevelPages.map((page) => (
              <PageTreeItem
                key={page.id}
                page={page}
                pages={pages}
                workspaceId={workspaceId}
                onDelete={handleDeletePage}
              />
            ))
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function PagesSidebar() {
  const { workspaces } = useWorkspaces();

  return (
    <Sidebar>
      <SidebarContent>
        {workspaces.map((workspace) => (
          <WorkspacePagesGroup
            key={workspace.id}
            workspaceId={workspace.id}
            workspaceName={workspace.name}
          />
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
