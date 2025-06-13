import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, ChevronRight, ChevronDown, MoreHorizontal, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import {
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuItem,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Page } from '@/hooks/usePages';
import { useAuth } from '@/contexts/AuthContext';
import { ContentType, ContentTypeUtils } from '@/types/contentTypes';
import { ContentTypeIcon } from '@/components/content-types/ContentTypeIcon';
import { 
  canNestPage, 
  getDepthIndicators, 
  MAX_VISIBLE_LEVELS 
} from '@/utils/navigationConstraints';
import { cn } from '@/lib/utils';

interface AccessiblePageTreeItemProps {
  page: Page;
  pages: Page[];
  workspaceId: string;
  onDelete: (pageId: string) => void;
  level?: number;
  index: number;
  focusedItemId?: string | null;
  onKeyDown?: (event: React.KeyboardEvent, itemId: string) => void;
  onToggleExpanded?: (itemId: string) => void;
  isExpanded?: boolean;
}

export function AccessiblePageTreeItem({ 
  page, 
  pages, 
  workspaceId, 
  onDelete, 
  level = 0, 
  index,
  focusedItemId,
  onKeyDown,
  onToggleExpanded,
  isExpanded: parentIsExpanded = false
}: AccessiblePageTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(parentIsExpanded);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const childPages = pages.filter(p => p.parent_page_id === page.id);
  const hasChildren = childPages.length > 0;
  const isOwner = page.created_by === user?.id;
  const isFocused = focusedItemId === page.id;

  // Check if this page is currently active
  const currentPagePath = `/workspace/${workspaceId}/page/${page.id}`;
  const isCurrentPage = location.pathname === currentPagePath;

  // Calculate depth indicators and constraints
  const depthInfo = getDepthIndicators(level);
  const { canAddChildren, isMaxDepth, showDepthWarning } = depthInfo;

  // Determine content type for icon display
  const shouldShowContentTypeIcon = level === 0;
  const contentType = shouldShowContentTypeIcon 
    ? (page.database_id ? ContentType.DATABASE : ContentType.PAGE)
    : null;

  const handleNavigate = () => {
    navigate(`/workspace/${workspaceId}/page/${page.id}`);
  };

  const handleToggleExpanded = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggleExpanded?.(page.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    onKeyDown?.(event, page.id);
  };

  // Choose appropriate icon based on hierarchy level and content
  const getItemIcon = () => {
    if (shouldShowContentTypeIcon && contentType) {
      return <ContentTypeIcon contentType={contentType} size="sm" showTooltip={false} />;
    }
    
    if (hasChildren) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleExpanded}
          className={cn(
            "sidebar-action-button",
            level === 0 ? "h-4 w-4 p-0" : "h-3 w-3 p-0"
          )}
          aria-label={isExpanded ? "Collapse" : "Expand"}
          aria-expanded={isExpanded}
          tabIndex={-1}
        >
          {isExpanded ? (
            <ChevronDown className={level === 0 ? "h-3 w-3" : "h-2 w-2"} />
          ) : (
            <ChevronRight className={level === 0 ? "h-3 w-3" : "h-2 w-2"} />
          )}
        </Button>
      );
    }
    
    return <FileText className={cn(
      level === 0 ? "h-3 w-3" : "h-3 w-3",
      "sidebar-text-muted"
    )} />;
  };

  const canCreateSubPage = canAddChildren && isOwner;

  const content = (
    <>
      <SidebarMenuButton 
        onClick={handleNavigate} 
        onKeyDown={handleKeyDown}
        tabIndex={isFocused ? 0 : -1}
        data-tree-item-id={page.id}
        aria-current={isCurrentPage ? "page" : undefined}
        className={cn(
          "sidebar-menu-item sidebar-focus-ring group",
          showDepthWarning && "warning-indicator",
          isMaxDepth && "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800",
          isFocused && "tree-item-focused"
        )}
      >
        <div className="flex items-center gap-2 w-full">
          {getItemIcon()}
          <span className="truncate flex-1 sidebar-text-primary">{page.title}</span>
          {showDepthWarning && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle 
                    className="h-3 w-3 text-amber-600 dark:text-amber-400" 
                    aria-label={`Warning: Nesting level ${level + 1} of ${MAX_VISIBLE_LEVELS}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Nesting level {level + 1}/{MAX_VISIBLE_LEVELS}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </SidebarMenuButton>
      {isOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction 
              showOnHover
              className="sidebar-action-button sidebar-focus-ring"
              aria-label={`More actions for ${page.title}`}
            >
              <MoreHorizontal />
              <span className="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side="right" 
            align="start"
            className="sidebar-dropdown-content"
          >
            <DropdownMenuItem 
              onClick={handleNavigate}
              className="sidebar-dropdown-item sidebar-focus-ring"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {!canCreateSubPage && isMaxDepth && (
              <DropdownMenuItem 
                disabled 
                className="sidebar-dropdown-item sidebar-text-muted"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Max nesting depth reached
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(page.id)}
              className="sidebar-dropdown-item sidebar-focus-ring text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );

  if (level === 0) {
    return (
      <Draggable draggableId={page.id} index={index}>
        {(provided, snapshot) => (
          <li 
            role="treeitem" 
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-level={level + 1}
            aria-setsize={pages.filter(p => p.parent_page_id === page.parent_page_id).length}
            aria-posinset={index + 1}
            aria-label={`${page.title}${hasChildren ? `, ${childPages.length} sub-pages` : ''}`}
          >
            <SidebarMenuItem
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className={cn(
                snapshot.isDragging && 'opacity-50',
                "sidebar-accessible"
              )}
            >
              {content}
              {isExpanded && hasChildren && canAddChildren && (
                <Droppable droppableId={`sub-${page.id}`} type="page">
                  {(provided) => (
                    <ul role="group" aria-label={`${page.title} sub-pages`}>
                      <SidebarMenuSub ref={provided.innerRef} {...provided.droppableProps}>
                        {childPages.map((childPage, childIndex) => (
                          <AccessiblePageTreeItem
                            key={childPage.id}
                            page={childPage}
                            pages={pages}
                            workspaceId={workspaceId}
                            onDelete={onDelete}
                            level={level + 1}
                            index={childIndex}
                            focusedItemId={focusedItemId}
                            onKeyDown={onKeyDown}
                            onToggleExpanded={onToggleExpanded}
                            isExpanded={false}
                          />
                        ))}
                        {provided.placeholder}
                      </SidebarMenuSub>
                    </ul>
                  )}
                </Droppable>
              )}
              {isExpanded && hasChildren && !canAddChildren && (
                <ul role="group" aria-label={`${page.title} sub-pages`}>
                  <SidebarMenuSub className="sidebar-accessible">
                    {childPages.map((childPage, childIndex) => (
                      <AccessiblePageTreeItem
                        key={childPage.id}
                        page={childPage}
                        pages={pages}
                        workspaceId={workspaceId}
                        onDelete={onDelete}
                        level={level + 1}
                        index={childIndex}
                        focusedItemId={focusedItemId}
                        onKeyDown={onKeyDown}
                        onToggleExpanded={onToggleExpanded}
                        isExpanded={false}
                      />
                    ))}
                  </SidebarMenuSub>
                </ul>
              )}
            </SidebarMenuItem>
          </li>
        )}
      </Draggable>
    );
  }

  return (
    <Draggable draggableId={page.id} index={index}>
      {(provided, snapshot) => (
        <li 
          role="treeitem" 
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-level={level + 1}
          aria-setsize={pages.filter(p => p.parent_page_id === page.parent_page_id).length}
          aria-posinset={index + 1}
          aria-label={`${page.title}${hasChildren ? `, ${childPages.length} sub-pages` : ''}`}
        >
          <SidebarMenuSubItem
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              snapshot.isDragging && 'opacity-50',
              showDepthWarning && "warning-indicator",
              isMaxDepth && "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800",
              "sidebar-accessible"
            )}
          >
            <SidebarMenuSubButton 
              onClick={handleNavigate}
              onKeyDown={handleKeyDown}
              tabIndex={isFocused ? 0 : -1}
              data-tree-item-id={page.id}
              aria-current={isCurrentPage ? "page" : undefined}
              className={cn(
                "sidebar-menu-item sidebar-focus-ring group",
                isFocused && "tree-item-focused"
              )}
            >
              <div className="flex items-center gap-2 w-full">
                {getItemIcon()}
                <span className="truncate flex-1 sidebar-text-primary">{page.title}</span>
                {showDepthWarning && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle 
                          className="h-3 w-3 text-amber-600 dark:text-amber-400"
                          aria-label={`Warning: Nesting level ${level + 1} of ${MAX_VISIBLE_LEVELS}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Nesting level {level + 1}/{MAX_VISIBLE_LEVELS}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="sidebar-action-button sidebar-focus-ring h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                        tabIndex={-1}
                        aria-label={`More actions for ${page.title}`}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      side="right" 
                      align="start"
                      className="sidebar-dropdown-content"
                    >
                      <DropdownMenuItem 
                        onClick={handleNavigate}
                        className="sidebar-dropdown-item sidebar-focus-ring"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {!canCreateSubPage && isMaxDepth && (
                        <DropdownMenuItem 
                          disabled 
                          className="sidebar-dropdown-item sidebar-text-muted"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Max nesting depth reached
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => onDelete(page.id)}
                        className="sidebar-dropdown-item sidebar-focus-ring text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </SidebarMenuSubButton>
            {isExpanded && hasChildren && canAddChildren && (
              <Droppable droppableId={`sub-${page.id}`} type="page">
                {(provided) => (
                  <ul role="group" aria-label={`${page.title} sub-pages`}>
                    <SidebarMenuSub ref={provided.innerRef} {...provided.droppableProps}>
                      {childPages.map((childPage, childIndex) => (
                        <AccessiblePageTreeItem
                          key={childPage.id}
                          page={childPage}
                          pages={pages}
                          workspaceId={workspaceId}
                          onDelete={onDelete}
                          level={level + 1}
                          index={childIndex}
                          focusedItemId={focusedItemId}
                          onKeyDown={onKeyDown}
                          onToggleExpanded={onToggleExpanded}
                          isExpanded={false}
                        />
                      ))}
                      {provided.placeholder}
                    </SidebarMenuSub>
                  </ul>
                )}
              </Droppable>
            )}
            {isExpanded && hasChildren && !canAddChildren && (
              <ul role="group" aria-label={`${page.title} sub-pages`}>
                <SidebarMenuSub>
                  {childPages.map((childPage, childIndex) => (
                    <AccessiblePageTreeItem
                      key={childPage.id}
                      page={childPage}
                      pages={pages}
                      workspaceId={workspaceId}
                      onDelete={onDelete}
                      level={level + 1}
                      index={childIndex}
                      focusedItemId={focusedItemId}
                      onKeyDown={onKeyDown}
                      onToggleExpanded={onToggleExpanded}
                      isExpanded={false}
                    />
                  ))}
                </SidebarMenuSub>
              </ul>
            )}
          </SidebarMenuSubItem>
        </li>
      )}
    </Draggable>
  );
}
