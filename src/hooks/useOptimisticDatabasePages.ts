
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PageService } from '@/services/pageService';
import { useFilteredDatabasePagesQuery } from '@/hooks/useFilteredDatabasePagesQuery';
import { useOptimisticPropertyUpdate } from '@/hooks/useOptimisticPropertyUpdate';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { Block } from '@/types/block';

interface UseOptimisticDatabasePagesProps {
  workspaceId: string;
  databaseId: string;
  filterGroup: FilterGroup;
  fields: DatabaseField[];
  sortRules: SortRule[];
}

export function useOptimisticDatabasePages({
  workspaceId,
  databaseId,
  filterGroup,
  fields,
  sortRules,
}: UseOptimisticDatabasePagesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { pages, loading, error, refetch, queryKey } = useFilteredDatabasePagesQuery({
    databaseId,
    filterGroup,
    fields,
    sortRules,
  });

  const propertyUpdateMutation = useOptimisticPropertyUpdate(databaseId);

  const updatePageMutation = useMutation({
    mutationFn: ({ pageId, updates }: { pageId: string, updates: Partial<Block> }) => PageService.updatePage(pageId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update page.', variant: 'destructive' });
    }
  });

  const createPageMutation = useMutation({
    mutationFn: (pageData: { title: string }) => {
      if (!user) throw new Error("User not authenticated");
      const newPageData: Partial<Block> = {
        type: 'page',
        properties: {
          title: pageData.title || 'Untitled',
          database_id: databaseId
        }
      };
      return PageService.createPage(workspaceId, user.id, newPageData);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'New entry created' });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create entry.', variant: 'destructive' });
    }
  });

  return {
    pages,
    loading,
    error,
    refetch,
    optimisticUpdateProperty: propertyUpdateMutation.mutate,
    optimisticUpdatePage: updatePageMutation.mutate,
    optimisticCreatePage: createPageMutation.mutate,
  };
}
