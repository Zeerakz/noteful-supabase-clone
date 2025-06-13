
import { useState, useCallback } from 'react';
import { Page } from '@/types/page';

interface OptimisticPageUpdate {
  id: string;
  updates: Partial<Page>;
  timestamp: number;
}

interface UseOptimisticPagesProps {
  pages: Page[];
  onServerUpdate?: (pages: Page[]) => void;
}

export function useOptimisticPages({ pages, onServerUpdate }: UseOptimisticPagesProps) {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, OptimisticPageUpdate>>(new Map());
  const [optimisticCreations, setOptimisticCreations] = useState<Page[]>([]);
  const [optimisticDeletions, setOptimisticDeletions] = useState<Set<string>>(new Set());

  // Apply optimistic updates to the pages list
  const optimisticPages = pages
    .filter(page => !optimisticDeletions.has(page.id))
    .map(page => {
      const update = optimisticUpdates.get(page.id);
      return update ? { ...page, ...update.updates } : page;
    })
    .concat(optimisticCreations.filter(optimisticPage => {
      // Only include optimistic creations that haven't been replaced by real pages
      // Use more specific matching to prevent false positives
      return !pages.some(realPage => 
        realPage.id === optimisticPage.id || // Direct ID match (for when server returns same ID)
        (
          realPage.title === optimisticPage.title && 
          realPage.workspace_id === optimisticPage.workspace_id &&
          realPage.parent_page_id === optimisticPage.parent_page_id &&
          Math.abs(new Date(realPage.created_at).getTime() - new Date(optimisticPage.created_at).getTime()) < 5000 // Within 5 seconds
        )
      );
    }))
    .sort((a, b) => a.order_index - b.order_index);

  const optimisticCreatePage = useCallback((pageData: Partial<Page>) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const now = new Date().toISOString();
    const optimisticPage: Page = {
      id: tempId,
      title: pageData.title || 'Untitled',
      workspace_id: pageData.workspace_id || '',
      created_by: pageData.created_by || '',
      created_at: now,
      updated_at: now,
      parent_page_id: pageData.parent_page_id || null,
      order_index: pageData.order_index || Date.now(),
      database_id: pageData.database_id || null,
      ...pageData,
    };

    setOptimisticCreations(prev => [...prev, optimisticPage]);
    
    // Auto-cleanup after 10 seconds to prevent orphaned optimistic pages
    setTimeout(() => {
      setOptimisticCreations(current => 
        current.filter(page => page.id !== tempId)
      );
    }, 10000);
    
    return tempId;
  }, []);

  const optimisticUpdatePage = useCallback((pageId: string, updates: Partial<Page>) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.set(pageId, {
        id: pageId,
        updates: { ...updates, updated_at: new Date().toISOString() },
        timestamp: Date.now(),
      });
      return newMap;
    });

    // Auto-cleanup update after 30 seconds
    setTimeout(() => {
      setOptimisticUpdates(current => {
        const newMap = new Map(current);
        const update = newMap.get(pageId);
        if (update && Date.now() - update.timestamp > 30000) {
          newMap.delete(pageId);
        }
        return newMap;
      });
    }, 30000);
  }, []);

  const optimisticDeletePage = useCallback((pageId: string) => {
    setOptimisticDeletions(prev => new Set(prev).add(pageId));
    
    // Auto-cleanup deletion after 30 seconds
    setTimeout(() => {
      setOptimisticDeletions(current => {
        const newSet = new Set(current);
        newSet.delete(pageId);
        return newSet;
      });
    }, 30000);
  }, []);

  const clearOptimisticUpdate = useCallback((pageId: string) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(pageId);
      return newMap;
    });
  }, []);

  const clearOptimisticCreation = useCallback((tempId: string) => {
    setOptimisticCreations(prev => prev.filter(page => page.id !== tempId));
  }, []);

  const clearOptimisticDeletion = useCallback((pageId: string) => {
    setOptimisticDeletions(prev => {
      const newSet = new Set(prev);
      newSet.delete(pageId);
      return newSet;
    });
  }, []);

  const clearOptimisticCreationByMatch = useCallback((realPage: Page) => {
    setOptimisticCreations(prev => prev.filter(optimisticPage => {
      // Remove optimistic pages that match the real page
      // Use the same matching logic as in optimisticPages calculation
      return !(
        optimisticPage.title === realPage.title && 
        optimisticPage.workspace_id === realPage.workspace_id &&
        optimisticPage.parent_page_id === realPage.parent_page_id &&
        Math.abs(new Date(realPage.created_at).getTime() - new Date(optimisticPage.created_at).getTime()) < 5000
      );
    }));
  }, []);

  const revertAllOptimisticChanges = useCallback(() => {
    setOptimisticUpdates(new Map());
    setOptimisticCreations([]);
    setOptimisticDeletions(new Set());
  }, []);

  return {
    optimisticPages,
    optimisticCreatePage,
    optimisticUpdatePage,
    optimisticDeletePage,
    clearOptimisticUpdate,
    clearOptimisticCreation,
    clearOptimisticDeletion,
    clearOptimisticCreationByMatch,
    revertAllOptimisticChanges,
    hasOptimisticChanges: optimisticUpdates.size > 0 || optimisticCreations.length > 0 || optimisticDeletions.size > 0,
  };
}
