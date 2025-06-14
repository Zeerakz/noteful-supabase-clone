
import { useMemo } from 'react';
import { Page } from '@/hooks/usePages';

interface FlattenedPageItem {
  page: Page;
  level: number;
  index: number;
  isVisible: boolean;
}

export function useVirtualizedPages(pages: Page[], expandedPages: Set<string>) {
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

  return {
    flattenedPages,
    treeItems,
  };
}
