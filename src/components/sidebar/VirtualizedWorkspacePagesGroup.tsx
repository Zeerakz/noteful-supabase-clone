
import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useToast } from '@/hooks/use-toast';
import { useTreeViewKeyboardNavigation } from '@/hooks/useTreeViewKeyboardNavigation';
import { PageTreeItem } from './PageTreeItem';
import { validateDragAndDrop } from '@/utils/navigationConstraints';
import { Page } from '@/hooks/usePages';

interface VirtualizedWorkspacePagesGroupProps {
  workspaceId: string;
  workspaceName: string;
  onNavigationItemSelect?: () => void;
}

interface FlattenedPageItem {
  page: Page;
  level: number;
  index: number;
  isVisible: boolean;
}

export function VirtualizedWorkspacePagesGroup({ 
  workspaceId, 
  workspaceName, 
  onNavigationItemSelect 
}: VirtualizedWorkspacePagesGroupProps) {
  const { pages, updatePageHierarchy, deletePage, hasOptimisticChanges, loading } = useEnhancedPages(workspaceId);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const parentRef = useRef<HTMLDivElement>(null);

  // Flatten the page tree for virtualization
  const flattenedPages = useMemo(() => {
    const flattenPages = (pages: Page[], parentId: string | null = null, level: number = 0): FlattenedPageItem[] => {
      const result: FlattenedPageItem[] = [];
      const filteredPages = pages.filter(page => page.parent_page_id === parentId);
      
      filteredPages.forEach((page, index) => {
        result.push({
          page,
          level,
          index,
          isVisible: true
        });
        
        // If page is expanded, add its children
        if (expandedPages.has(page.id)) {
          const children = flattenPages(pages, page.id, level + 1);
          result.push(...children);
        }
      });
      
      return result;
    };
    
    return flattenPages(pages);
  }, [pages, expandedPages]);

  // Convert flattened pages to tree items for keyboard navigation
  const treeItems = useMemo(() => {
    return flattenedPages.map(({ page, level }) => ({
      id: page.id,
      parentId: page.parent_page_id,
      hasChildren: pages.some(p => p.parent_page_id === page.id),
      isExpanded: expandedPages.has(page.id),
      level,
    }));
  }, [flattenedPages, pages, expandedPages]);

  // Initialize virtualizer
  const virtualizer = useVirtualizer({
    count: flattenedPages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // Estimated height per item in pixels
    overscan: 10, // Render 10 extra items outside viewport for smooth scrolling
  });

  // Keyboard navigation handlers
  const handleNavigate = (pageId: string) => {
    navigate(`/workspace/${workspaceId}/page/${pageId}`);
    onNavigationItemSelect?.();
  };

  const handleToggleExpanded = (pageId: string) => {
    setExpandedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return newSet;
    });
  };

  const handleActivate = (pageId: string) => {
    navigate(`/workspace/${workspaceId}/page/${pageId}`);
    onNavigationItemSelect?.();
  };

  const {
    focusedItemId,
    containerRef,
    handleKeyDown,
    focusItem,
  } = useTreeViewKeyboardNavigation({
    items: treeItems,
    onNavigate: handleNavigate,
    onToggleExpanded: handleToggleExpanded,
    onActivate: handleActivate,
  });

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

    // Validate the drag and drop operation against depth constraints
    const validation = validateDragAndDrop(pages, draggableId, newParentId, destination.index);
    
    if (!validation.isValid) {
      toast({
        title: "Cannot move page",
        description: validation.error,
        variant: "destructive",
      });
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
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    if (!confirm(`Are you sure you want to delete "${page.title}"? This action cannot be undone.`)) {
      return;
    }

    await deletePage(pageId);
  };

  if (loading) {
    return (
      <li role="treeitem" aria-expanded="false">
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span className="truncate flex items-center gap-2">
              {workspaceName}
              <Loader2 className="h-3 w-3 animate-spin" />
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton disabled className="text-muted-foreground">
                  Loading pages...
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </li>
    );
  }

  return (
    <li role="treeitem" aria-expanded="true">
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center justify-between">
          <span className="truncate flex items-center gap-2">
            {workspaceName}
            {hasOptimisticChanges && (
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Syncing changes..." />
            )}
          </span>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={`workspace-${workspaceId}`} type="page">
              {(provided) => (
                <nav aria-label={`${workspaceName} pages navigation`} ref={containerRef}>
                  <ul role="group" aria-label={`${workspaceName} pages`}>
                    <SidebarMenu ref={provided.innerRef} {...provided.droppableProps}>
                      {flattenedPages.length === 0 ? (
                        <SidebarMenuItem>
                          <SidebarMenuButton className="text-muted-foreground" disabled>
                            <span>No pages yet</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ) : (
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
                                    onDelete={handleDeletePage}
                                    index={flattenedPage.index}
                                    focusedItemId={focusedItemId}
                                    onKeyDown={handleKeyDown}
                                    onToggleExpanded={handleToggleExpanded}
                                    isExpanded={expandedPages.has(flattenedPage.page.id)}
                                    level={flattenedPage.level}
                                    onNavigationItemSelect={onNavigationItemSelect}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {provided.placeholder}
                    </SidebarMenu>
                  </ul>
                </nav>
              )}
            </Droppable>
          </DragDropContext>
        </SidebarGroupContent>
      </SidebarGroup>
    </li>
  );
}
