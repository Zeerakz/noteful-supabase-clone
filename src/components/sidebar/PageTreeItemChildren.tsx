
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { SidebarMenu } from '@/components/ui/sidebar';
import { PageTreeItem } from './PageTreeItem';
import { Page } from '@/hooks/usePages';

interface PageTreeItemChildrenProps {
  page: Page;
  subPages: Page[];
  pages: Page[];
  workspaceId: string;
  onDelete: (pageId: string) => void;
  focusedItemId?: string;
  onKeyDown?: (e: React.KeyboardEvent, itemId: string) => void;
  onToggleExpanded?: (pageId: string) => void;
  isExpanded?: boolean;
  level: number;
  onNavigationItemSelect?: () => void;
}

export function PageTreeItemChildren({
  page,
  subPages,
  pages,
  workspaceId,
  onDelete,
  focusedItemId,
  onKeyDown,
  onToggleExpanded,
  isExpanded,
  level,
  onNavigationItemSelect,
}: PageTreeItemChildrenProps) {
  if (!subPages.length || !isExpanded) {
    return null;
  }

  return (
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
  );
}
