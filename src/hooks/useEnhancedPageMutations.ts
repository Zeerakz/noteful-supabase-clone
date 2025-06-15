import { Block } from '@/types/block';
import { useEnhancedCreatePage } from './mutations/useEnhancedCreatePage';
import { useEnhancedUpdatePage } from './mutations/useEnhancedUpdatePage';
import { useEnhancedDeletePage } from './mutations/useEnhancedDeletePage';
import { useEnhancedUpdatePageHierarchy } from './mutations/useEnhancedUpdatePageHierarchy';

interface UseEnhancedPageMutationsProps {
  workspaceId?: string;
  createPage: (title: string, parentId?: string, databaseId?: string) => Promise<{ data?: Block | null; error: string | null }>;
  updatePage: (id: string, updates: Partial<Block>) => Promise<{ data: Block | null; error: string | null }>;
  deletePage: (id: string) => Promise<{ error: string | null }>;
  updatePageHierarchy: (pageId: string, newParentId: string | null, newIndex: number) => Promise<{ error: string | null }>;
  optimisticPages: Block[];
  optimisticCreatePage: (pageData: Partial<Block>) => string;
  optimisticUpdatePage: (pageId: string, updates: Partial<Block>) => void;
  optimisticDeletePage: (pageId: string) => void;
  clearOptimisticUpdate: (pageId: string) => void;
  clearOptimisticCreation: (tempId: string) => void;
  clearOptimisticCreationByMatch: (realPage: Block) => void;
  revertAllOptimisticChanges: () => void;
}

export function useEnhancedPageMutations({
  workspaceId,
  createPage,
  updatePage,
  deletePage,
  updatePageHierarchy,
  optimisticPages,
  optimisticCreatePage,
  optimisticUpdatePage,
  optimisticDeletePage,
  clearOptimisticUpdate,
  clearOptimisticCreation,
  clearOptimisticCreationByMatch,
  revertAllOptimisticChanges,
}: UseEnhancedPageMutationsProps) {
  
  const enhancedCreatePage = useEnhancedCreatePage({
    workspaceId,
    createPage,
    optimisticPages,
    optimisticCreatePage,
    clearOptimisticCreation,
    clearOptimisticCreationByMatch,
  });

  const enhancedUpdatePage = useEnhancedUpdatePage({
    updatePage,
    optimisticPages,
    optimisticUpdatePage,
    clearOptimisticUpdate,
    revertAllOptimisticChanges,
  });

  const enhancedDeletePage = useEnhancedDeletePage({
    deletePage,
    optimisticPages,
    optimisticDeletePage,
    revertAllOptimisticChanges,
  });

  const enhancedUpdatePageHierarchy = useEnhancedUpdatePageHierarchy({
    updatePageHierarchy,
    optimisticPages,
    optimisticUpdatePage,
    clearOptimisticUpdate,
    revertAllOptimisticChanges,
  });
  
  return {
    createPage: enhancedCreatePage,
    updatePage: enhancedUpdatePage,
    deletePage: enhancedDeletePage,
    updatePageHierarchy: enhancedUpdatePageHierarchy,
  };
}
