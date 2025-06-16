import { Block } from '@/types/block';
import { useOptimisticState } from '@/hooks/useOptimisticState';

interface UseOptimisticPagesProps {
  pages: Block[];
}

export function useOptimisticPages({ pages }: UseOptimisticPagesProps) {
  const {
    optimisticData: optimisticPages,
    applyOptimisticUpdate,
    clearOptimisticUpdate,
    clearOptimisticByMatch,
    hasOptimisticChanges,
    revertAllOptimisticChanges,
  } = useOptimisticState<Block>(pages, {
    keyExtractor: (page) => page.id,
    matcher: (serverPage, optimisticPage) => {
      // Match by parent_id, type, and properties for newly created pages
      return serverPage.type === 'page' &&
             optimisticPage.type === 'page' &&
             serverPage.parent_id === optimisticPage.parent_id &&
             serverPage.properties?.title === optimisticPage.properties?.title &&
             Math.abs(new Date(serverPage.created_time).getTime() - new Date(optimisticPage.created_time).getTime()) < 10000;
    }
  });

  const optimisticCreatePage = (pageData: Partial<Block>) => {
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const optimisticPage: Block = {
      id: tempId,
      type: 'page',
      workspace_id: pageData.workspace_id || '',
      teamspace_id: pageData.teamspace_id || null,
      parent_id: pageData.parent_id || null,
      properties: pageData.properties || {},
      content: pageData.content || {},
      pos: pageData.pos ?? Date.now() % 1000000,
      created_time: now,
      last_edited_time: now,
      created_by: pageData.created_by || null,
      last_edited_by: null,
      archived: false,
      in_trash: false,
    };

    return applyOptimisticUpdate('create', optimisticPage, tempId);
  };

  const optimisticUpdatePage = (pageId: string, updates: Partial<Block>) => {
    const existingPage = pages.find(p => p.id === pageId);
    if (!existingPage) return;

    const updatedPage = {
      ...existingPage,
      ...updates,
      last_edited_time: new Date().toISOString(),
    };

    applyOptimisticUpdate('update', updatedPage);
  };

  const optimisticDeletePage = (pageId: string) => {
    const existingPage = pages.find(p => p.id === pageId);
    if (!existingPage) return;

    applyOptimisticUpdate('delete', existingPage);
  };

  const clearOptimisticCreation = (tempId: string) => {
    clearOptimisticUpdate(tempId);
  };

  const clearOptimisticCreationByMatch = (serverPage: Block) => {
    clearOptimisticByMatch(serverPage);
  };

  const clearOptimisticDeletion = (pageId: string) => {
    clearOptimisticUpdate(pageId);
  };

  return {
    optimisticPages,
    optimisticCreatePage,
    optimisticUpdatePage,
    optimisticDeletePage,
    clearOptimisticUpdate,
    clearOptimisticCreation,
    clearOptimisticCreationByMatch,
    clearOptimisticDeletion,
    revertAllOptimisticChanges,
    hasOptimisticChanges,
  };
}
