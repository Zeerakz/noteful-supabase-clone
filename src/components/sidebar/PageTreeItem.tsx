
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { SidebarMenuItem } from '@/components/ui/sidebar';
import { Page } from '@/hooks/usePages';
import { cn } from '@/lib/utils';
import { usePageTreeItem } from '@/hooks/usePageTreeItem';
import { PageTreeItemButton } from './PageTreeItemButton';
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
  const isFocused = focusedItemId === page.id;

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    onKeyDown?.(e, page.id);
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
            <PageTreeItemButton
              title={page.title}
              isActive={isActive}
              isFocused={isFocused}
              hasChildren={hasChildren}
              isExpanded={isExpanded}
              level={level}
              onNavigate={handleNavigate}
              onToggle={handleToggle}
              onKeyDown={handleKeyDown}
              dragHandleProps={provided.dragHandleProps}
            />

            <PageTreeItemActions onDelete={handleDelete} />
          </SidebarMenuItem>

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
        </div>
      )}
    </Draggable>
  );
}
