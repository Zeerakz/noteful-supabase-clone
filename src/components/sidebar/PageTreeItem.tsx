
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { FileText, ChevronRight, ChevronDown, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenu,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Page } from '@/hooks/usePages';
import { cn } from '@/lib/utils';

interface PageTreeItemProps {
  page: Page;
  pages: Page[];
  workspaceId: string;
  onDelete: (pageId: string) => void;
  index: number;
  focusedItemId?: string;
  onKeyDown?: (e: React.KeyboardEvent, itemId: string) => void;
  onToggleExpanded?: (pageId: string) => void;
  isExpanded?: boolean;
  level?: number;
  onNavigationItemSelect?: () => void;
}

export function PageTreeItem({
  page,
  pages,
  workspaceId,
  onDelete,
  index,
  focusedItemId,
  onKeyDown,
  onToggleExpanded,
  isExpanded = false,
  level = 0,
  onNavigationItemSelect,
}: PageTreeItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const subPages = pages.filter(p => p.parent_page_id === page.id);
  const hasChildren = subPages.length > 0;
  const isFocused = focusedItemId === page.id;

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    onKeyDown?.(e, page.id);
  };

  const handleDelete = () => {
    onDelete(page.id);
  };

  return (
    <Draggable draggableId={page.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "relative",
            snapshot.isDragging && "z-50"
          )}
        >
          <SidebarMenuItem
            role="treeitem"
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-level={level + 1}
            className={cn(
              "group relative",
              isFocused && "ring-2 ring-ring ring-offset-2 rounded-md"
            )}
            style={{ paddingLeft: `${level * 16}px` }}
          >
            <SidebarMenuButton
              onClick={handleNavigate}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-full justify-start text-left pr-8",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              )}
              data-active={isActive}
              tabIndex={isFocused ? 0 : -1}
            >
              <div {...provided.dragHandleProps} className="flex items-center gap-1 min-w-0 flex-1">
                {hasChildren ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggle}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                ) : (
                  <div className="w-4" />
                )}
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{page.title}</span>
              </div>
            </SidebarMenuButton>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction className="data-[state=open]:bg-sidebar-accent">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Page options</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          {hasChildren && isExpanded && (
            <Droppable droppableId={`sub-${page.id}`} type="page">
              {(provided) => (
                <SidebarMenu ref={provided.innerRef} {...provided.droppableProps}>
                  {subPages.map((subPage, subIndex) => (
                    <PageTreeItem
                      key={subPage.id}
                      page={subPage}
                      pages={pages}
                      workspaceId={workspaceId}
                      onDelete={onDelete}
                      index={subIndex}
                      focusedItemId={focusedItemId}
                      onKeyDown={onKeyDown}
                      onToggleExpanded={onToggleExpanded}
                      isExpanded={isExpanded}
                      level={level + 1}
                      onNavigationItemSelect={onNavigationItemSelect}
                    />
                  ))}
                  {provided.placeholder}
                </SidebarMenu>
              )}
            </Droppable>
          )}
        </div>
      )}
    </Draggable>
  );
}
