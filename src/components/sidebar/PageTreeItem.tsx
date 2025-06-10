
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, ChevronDown, MoreHorizontal, Trash2, Edit } from 'lucide-react';
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
import { Page } from '@/hooks/usePages';
import { useAuth } from '@/contexts/AuthContext';

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
  
  const childPages = pages.filter(p => p.parent_page_id === page.id);
  const hasChildren = childPages.length > 0;
  const isOwner = page.created_by === user?.id;

  const handleNavigate = () => {
    navigate(`/workspace/${workspaceId}/page/${page.id}`);
  };

  const content = (
    <>
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
    </>
  );

  if (level === 0) {
    return (
      <Draggable draggableId={page.id} index={index}>
        {(provided, snapshot) => (
          <SidebarMenuItem
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={snapshot.isDragging ? 'opacity-50' : ''}
          >
            {content}
            {isExpanded && hasChildren && (
              <Droppable droppableId={`sub-${page.id}`} type="page">
                {(provided) => (
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
                )}
              </Droppable>
            )}
          </SidebarMenuItem>
        )}
      </Draggable>
    );
  }

  return (
    <Draggable draggableId={page.id} index={index}>
      {(provided, snapshot) => (
        <SidebarMenuSubItem
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={snapshot.isDragging ? 'opacity-50' : ''}
        >
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
            <Droppable droppableId={`sub-${page.id}`} type="page">
              {(provided) => (
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
              )}
            </Droppable>
          )}
        </SidebarMenuSubItem>
      )}
    </Draggable>
  );
}
