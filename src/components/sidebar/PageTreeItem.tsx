
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Page } from '@/types/page';
import { useAuth } from '@/contexts/AuthContext';
import { ContentType, ContentTypeUtils } from '@/types/contentTypes';
import { ContentTypeIcon } from '@/components/content-types/ContentTypeIcon';
import { 
  canNestPage, 
  getDepthIndicators, 
  MAX_VISIBLE_LEVELS 
} from '@/utils/navigationConstraints';
import { cn } from '@/lib/utils';

interface PageTreeItemProps {
  page: Page;
  pages: Page[];
  workspaceId: string;
  onDelete: (pageId: string) => void;
  level?: number;
  index: number;
}

export function PageTreeItem({ page, pages, workspaceId, onDelete, level = 0, index }: PageTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const childPages = pages.filter(p => p.parent_id === page.id);
  const hasChildren = childPages.length > 0;
  const isOwner = page.created_by === user?.id;

  // Calculate depth indicators and constraints
  const depthInfo = getDepthIndicators(level);
  const { canAddChildren, isMaxDepth, showDepthWarning } = depthInfo;

  // Determine content type for icon display
  // Only show content type icons for first-level items (level 0)
  const shouldShowContentTypeIcon = level === 0;
  const contentType = shouldShowContentTypeIcon 
    ? (page.type === 'database' ? ContentType.DATABASE : ContentType.PAGE)
    : null;

  const handleNavigate = () => {
    navigate(`/workspace/${workspaceId}/page/${page.id}`);
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
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={level === 0 ? "h-4 w-4 p-0" : "h-3 w-3 p-0"}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronDown className={level === 0 ? "h-3 w-3" : "h-2 w-2"} />
          ) : (
            <ChevronRight className={level === 0 ? "h-3 w-3" : "h-2 w-2"} />
          )}
        </Button>
      );
    }
    
    // For child items without children, use a simple file icon
    return <FileText className={level === 0 ? "h-3 w-3 text-muted-foreground" : "h-3 w-3 text-muted-foreground"} />;
  };

  // Check if we can add children to this page (for potential sub-page creation)
  const canCreateSubPage = canAddChildren && isOwner;

  const content = (
    <>
      <SidebarMenuButton 
        onClick={handleNavigate} 
        className={cn(
          "group",
          showDepthWarning && "bg-yellow-50 dark:bg-yellow-950/20",
          isMaxDepth && "bg-red-50 dark:bg-red-950/20"
        )}
      >
        <div className="flex items-center gap-2 w-full">
          {getItemIcon()}
          <span className="truncate flex-1">{page.properties?.title || 'Untitled'}</span>
          {showDepthWarning && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
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
            {!canCreateSubPage && isMaxDepth && (
              <DropdownMenuItem disabled className="text-muted-foreground">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Max nesting depth reached
              </DropdownMenuItem>
            )}
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
    </>
  );

  if (level === 0) {
    return (
      <Draggable draggableId={page.id} index={index}>
        {(provided, snapshot) => (
          <li role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
            <SidebarMenuItem
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className={snapshot.isDragging ? 'opacity-50' : ''}
            >
              {content}
              {isExpanded && hasChildren && canAddChildren && (
                <Droppable droppableId={`sub-${page.id}`} type="page">
                  {(provided) => (
                    <ul role="group" aria-label={`${page.properties?.title || 'Untitled'} sub-pages`}>
                      <SidebarMenuSub ref={provided.innerRef} {...provided.droppableProps}>
                        {childPages.map((childPage, childIndex) => (
                          <PageTreeItem
                            key={childPage.id}
                            page={childPage}
                            pages={pages}
                            workspaceId={workspaceId}
                            onDelete={onDelete}
                            level={level + 1}
                            index={childIndex}
                          />
                        ))}
                        {provided.placeholder}
                      </SidebarMenuSub>
                    </ul>
                  )}
                </Droppable>
              )}
              {isExpanded && hasChildren && !canAddChildren && (
                <ul role="group" aria-label={`${page.properties?.title || 'Untitled'} sub-pages`}>
                  <SidebarMenuSub>
                    {childPages.map((childPage, childIndex) => (
                      <PageTreeItem
                        key={childPage.id}
                        page={childPage}
                        pages={pages}
                        workspaceId={workspaceId}
                        onDelete={onDelete}
                        level={level + 1}
                        index={childIndex}
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
        <li role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
          <SidebarMenuSubItem
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              snapshot.isDragging ? 'opacity-50' : '',
              showDepthWarning && "bg-yellow-50 dark:bg-yellow-950/20",
              isMaxDepth && "bg-red-50 dark:bg-red-950/20"
            )}
          >
            <SidebarMenuSubButton 
              onClick={handleNavigate} 
              className="group"
            >
              <div className="flex items-center gap-2 w-full">
                {getItemIcon()}
                <span className="truncate flex-1">{page.properties?.title || 'Untitled'}</span>
                {showDepthWarning && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
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
                      {!canCreateSubPage && isMaxDepth && (
                        <DropdownMenuItem disabled className="text-muted-foreground">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Max nesting depth reached
                        </DropdownMenuItem>
                      )}
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
            {isExpanded && hasChildren && canAddChildren && (
              <Droppable droppableId={`sub-${page.id}`} type="page">
                {(provided) => (
                  <ul role="group" aria-label={`${page.properties?.title || 'Untitled'} sub-pages`}>
                    <SidebarMenuSub ref={provided.innerRef} {...provided.droppableProps}>
                      {childPages.map((childPage, childIndex) => (
                        <PageTreeItem
                          key={childPage.id}
                          page={childPage}
                          pages={pages}
                          workspaceId={workspaceId}
                          onDelete={onDelete}
                          level={level + 1}
                          index={childIndex}
                        />
                      ))}
                      {provided.placeholder}
                    </SidebarMenuSub>
                  </ul>
                )}
              </Droppable>
            )}
            {isExpanded && hasChildren && !canAddChildren && (
              <ul role="group" aria-label={`${page.properties?.title || 'Untitled'} sub-pages`}>
                <SidebarMenuSub>
                  {childPages.map((childPage, childIndex) => (
                    <PageTreeItem
                      key={childPage.id}
                      page={childPage}
                      pages={pages}
                      workspaceId={workspaceId}
                      onDelete={onDelete}
                      level={level + 1}
                      index={childIndex}
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
