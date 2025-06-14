
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { ChevronRight, ChevronDown } from 'lucide-react';
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Page } from '@/hooks/usePages';
import { usePageTreeItem } from '@/hooks/usePageTreeItem';
import { PageTreeItemActions } from './PageTreeItemActions';
import { PageTreeItemChildren } from './PageTreeItemChildren';

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
  level: number;
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
  level,
  onNavigationItemSelect,
}: PageTreeItemProps) {
  const {
    subPages,
    hasChildren,
    isActive,
    handleNavigate,
    handleToggle,
    handleDelete,
  } = usePageTreeItem({
    page,
    pages,
    workspaceId,
    onNavigationItemSelect,
    onToggleExpanded,
    onDelete,
  });

  const isFocused = focusedItemId === page.id;

  return (
    <>
      <Draggable draggableId={page.id} index={index}>
        {(provided, snapshot) => (
          <SidebarMenuItem
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              "group",
              snapshot.isDragging && "opacity-50",
              level > 0 && "ml-4"
            )}
            data-testid="page-tree-item"
            data-tree-item-id={page.id}
          >
            <SidebarMenuButton
              onClick={handleNavigate}
              onKeyDown={(e) => onKeyDown?.(e, page.id)}
              isActive={isActive}
              tabIndex={isFocused ? 0 : -1}
              className={cn(
                "flex items-center gap-2 w-full justify-between group-hover:bg-accent/50 transition-colors",
                isFocused && "ring-2 ring-ring ring-offset-2",
                isActive && "bg-accent font-medium"
              )}
              role="treeitem"
              aria-expanded={hasChildren ? isExpanded : undefined}
              aria-level={level + 1}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {hasChildren && (
                  <button
                    onClick={handleToggle}
                    className="flex-shrink-0 p-0.5 hover:bg-accent rounded-sm transition-colors"
                    data-testid="expand-toggle"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                )}
                {!hasChildren && <div className="w-4" />}
                
                <span className="truncate text-sm" title={page.title}>
                  {page.title}
                </span>
              </div>
              
              <div 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid="page-actions"
              >
                <PageTreeItemActions onDelete={handleDelete} />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </Draggable>

      <PageTreeItemChildren
        page={page}
        subPages={subPages}
        pages={pages}
        workspaceId={workspaceId}
        onDelete={onDelete}
        focusedItemId={focusedItemId}
        onKeyDown={onKeyDown}
        onToggleExpanded={onToggleExpanded}
        isExpanded={isExpanded}
        level={level}
        onNavigationItemSelect={onNavigationItemSelect}
      />
    </>
  );
}
