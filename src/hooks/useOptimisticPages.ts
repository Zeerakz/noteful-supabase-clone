
import { useState, useCallback } from 'react';
import { Block } from '@/types/block';

interface OptimisticPageUpdate {
  id: string;
  updates: Partial<Block>;
  timestamp: number;
}

interface UseOptimisticPagesProps {
  pages: Block[];
  onServerUpdate?: (pages: Block[]) => void;
}

export function useOptimisticPages({ pages, onServerUpdate }: UseOptimisticPagesProps) {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, OptimisticPageUpdate>>(new Map());
  const [optimisticCreations, setOptimisticCreations] = useState<Block[]>([]);
  const [optimisticDeletions, setOptimisticDeletions] = useState<Set<string>>(new Set());

  // Helper function to get next position for optimistic pages
  const getNextOptimisticPosition = useCallback((parentId: string | null, workspaceId: string) => {
    // Get all pages with the same parent (including optimistic ones)
    const siblingPages = [
      ...pages.filter(page => 
        page.parent_id === parentId && 
        page.workspace_id === workspaceId &&
        !(page.properties as any)?.database_id // Exclude database entries
      ),
      ...optimisticCreations.filter(page => 
        page.parent_id === parentId && 
        page.workspace_id === workspaceId &&
        !(page.properties as any)?.database_id
      )
    ];

    if (siblingPages.length === 0) {
      return 0;
    }

    const maxPos = Math.max(...siblingPages.map(page => page.pos || 0));
    return maxPos + 1;
  }, [pages, optimisticCreations]);

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
          (realPage.properties as any)?.title === (optimisticPage.properties as any)?.title && 
          realPage.workspace_id === optimisticPage.workspace_id &&
          realPage.parent_id === optimisticPage.parent_id &&
          Math.abs(new Date(realPage.created_time).getTime() - new Date(optimisticPage.created_time).getTime()) < 5000 // Within 5 seconds
        )
      );
    }))
    .sort((a, b) => a.pos - b.pos);

  const optimisticCreatePage = useCallback((pageData: Partial<Block>) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const now = new Date().toISOString();
    const workspaceId = pageData.workspace_id || '';
    const parentId = pageData.parent_id || null;
    
    const optimisticPage: Block = {
      id: tempId,
      type: 'page',
      workspace_id: workspaceId,
      teamspace_id: pageData.teamspace_id ?? null,
      parent_id: parentId,
      properties: pageData.properties || { title: 'Untitled' },
      content: pageData.content || {},
      pos: pageData.pos ?? getNextOptimisticPosition(parentId, workspaceId),
      created_time: now,
      last_edited_time: now,
      created_by: pageData.created_by || '',
      last_edited_by: null,
      archived: false,
      in_trash: false,
    };

    setOptimisticCreations(prev => [...prev, optimisticPage]);
    
    // Auto-cleanup after 10 seconds to prevent orphaned optimistic pages
    setTimeout(() => {
      setOptimisticCreations(current => 
        current.filter(page => page.id !== tempId)
      );
    }, 10000);
    
    return tempId;
  }, [getNextOptimisticPosition]);

  const optimisticUpdatePage = useCallback((pageId: string, updates: Partial<Block>) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.set(pageId, {
        id: pageId,
        updates: { ...updates, last_edited_time: new Date().toISOString() },
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

  const clearOptimisticCreationByMatch = useCallback((realPage: Block) => {
    setOptimisticCreations(prev => prev.filter(optimisticPage => {
      // Remove optimistic pages that match the real page
      // Use the same matching logic as in optimisticPages calculation
      return !(
        (optimisticPage.properties as any)?.title === (realPage.properties as any)?.title && 
        optimisticPage.workspace_id === realPage.workspace_id &&
        optimisticPage.parent_id === realPage.parent_id &&
        Math.abs(new Date(realPage.created_time).getTime() - new Date(optimisticPage.created_time).getTime()) < 5000
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
