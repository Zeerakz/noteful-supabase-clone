
import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Droppable } from 'react-beautiful-dnd';
import { SidebarMenu } from '@/components/ui/sidebar';
import { PageTreeItem } from './PageTreeItem';
import { Page } from '@/hooks/usePages';

interface FlattenedPageItem {
  page: Page;
  level: number;
  index: number;
  isVisible: boolean;
}

interface VirtualizedPagesListProps {
  workspaceId: string;
  flattenedPages: FlattenedPageItem[];
  pages: Page[];
  expandedPages: Set<string>;
  focusedItemId?: string;
  onKeyDown?: (e: React.KeyboardEvent, itemId: string) => void;
  onToggleExpanded: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onNavigationItemSelect?: () => void;
}

export function VirtualizedPagesList({
  workspaceId,
  flattenedPages,
  pages,
  expandedPages,
  focusedItemId,
  onKeyDown,
  onToggleExpanded,
  onDeletePage,
  onNavigationItemSelect,
}: VirtualizedPagesListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Initialize virtualizer
  const virtualizer = useVirtualizer({
    count: flattenedPages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // Estimated height per item in pixels
    overscan: 10, // Render 10 extra items outside viewport for smooth scrolling
  });

  return (
    <Droppable droppableId={`workspace-${workspaceId}`} type="page">
      {(provided) => (
        <SidebarMenu ref={provided.innerRef} {...provided.droppableProps}>
          <div
            ref={parentRef}
            style={{
              height: '400px', // Fixed height for scrollable area
              overflow: 'auto',
            }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const flattenedPage = flattenedPages[virtualItem.index];
                if (!flattenedPage) return null;
                
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <PageTreeItem
                      key={flattenedPage.page.id}
                      page={flattenedPage.page}
                      pages={pages}
                      workspaceId={workspaceId}
                      onDelete={onDeletePage}
                      index={flattenedPage.index}
                      focusedItemId={focusedItemId}
                      onKeyDown={onKeyDown}
                      onToggleExpanded={onToggleExpanded}
                      isExpanded={expandedPages.has(flattenedPage.page.id)}
                      level={flattenedPage.level}
                      onNavigationItemSelect={onNavigationItemSelect}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {provided.placeholder}
        </SidebarMenu>
      )}
    </Droppable>
  );
}
