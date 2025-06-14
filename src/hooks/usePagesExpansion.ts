
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Page } from '@/hooks/usePages';

export function usePagesExpansion(pages: Page[]) {
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const location = useLocation();

  // Auto-expand pages that contain the currently active page
  useEffect(() => {
    const currentPath = location.pathname;
    const pageIdMatch = currentPath.match(/\/workspace\/[^/]+\/page\/([^/]+)/);
    
    if (pageIdMatch) {
      const currentPageId = pageIdMatch[1];
      const currentPage = pages.find(p => p.id === currentPageId);
      
      if (currentPage) {
        // Expand all parent pages up to the root
        const expandParents = (page: Page) => {
          if (page.parent_page_id) {
            setExpandedPages(prev => new Set(prev.add(page.parent_page_id!)));
            const parentPage = pages.find(p => p.id === page.parent_page_id);
            if (parentPage) {
              expandParents(parentPage);
            }
          }
        };
        expandParents(currentPage);
      }
    }
  }, [location.pathname, pages]);

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

  return {
    expandedPages,
    handleToggleExpanded,
  };
}
