
import { useCallback } from 'react';
import { Block } from '@/types/block';
import { useToast } from '@/hooks/use-toast';
import { canNestPage } from '@/utils/navigationConstraints';

interface UseEnhancedCreatePageProps {
  workspaceId?: string;
  createPage: (title: string, parentId?: string, databaseId?: string) => Promise<{ data?: Block | null; error: string | null }>;
  optimisticPages: Block[];
  optimisticCreatePage: (pageData: Partial<Block>) => string;
  clearOptimisticCreation: (tempId: string) => void;
  clearOptimisticCreationByMatch: (realPage: Block) => void;
}

export function useEnhancedCreatePage({
  workspaceId,
  createPage,
  optimisticPages,
  optimisticCreatePage,
  clearOptimisticCreation,
  clearOptimisticCreationByMatch,
}: UseEnhancedCreatePageProps) {
  const { toast } = useToast();

  const enhancedCreatePage = useCallback(async (title: string, parentPageId?: string, databaseId?: string) => {
    if (!workspaceId) return { data: null, error: 'Workspace not selected' };

    if (parentPageId) {
      const validation = canNestPage(optimisticPages, 'new-page', parentPageId);
      if (!validation.canNest) {
        toast({
          title: "Cannot create page",
          description: validation.reason,
          variant: "destructive",
        });
        return { data: null, error: validation.reason };
      }
    }

    console.log('Creating page optimistically:', { title, parentPageId, workspaceId, databaseId });

    const tempId = optimisticCreatePage({
      properties: { title, ...(databaseId && { database_id: databaseId }) },
      parent_id: parentPageId,
      workspace_id: workspaceId,
      type: 'page',
    });

    console.log('Created optimistic page with tempId:', tempId);

    try {
      const { data, error } = await createPage(title, parentPageId, databaseId);
      
      if (error) {
        console.error('Server page creation failed:', error);
        clearOptimisticCreation(tempId);
        throw new Error(error);
      }

      console.log('Server page creation successful:', data);

      if (data) {
        clearOptimisticCreationByMatch(data);
        console.log('Cleared optimistic page by match');
      } else {
        clearOptimisticCreation(tempId);
        console.log('Cleared optimistic page by tempId');
      }
      
      toast({
        title: "Success",
        description: "Page created successfully",
      });

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create page';
      console.error('Page creation error:', err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: errorMessage };
    }
  }, [workspaceId, createPage, optimisticCreatePage, clearOptimisticCreation, clearOptimisticCreationByMatch, toast, optimisticPages]);

  return enhancedCreatePage;
}
