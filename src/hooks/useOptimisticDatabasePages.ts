
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PageService } from '@/services/pageService';
import { useFilteredDatabasePagesQuery } from '@/hooks/useFilteredDatabasePagesQuery';
import { useOptimisticPropertyUpdate } from '@/hooks/useOptimisticPropertyUpdate';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { Page } from '@/types/page';

interface UseOptimisticDatabasePagesProps {
  databaseId: string;
  filterGroup: FilterGroup;
  fields: DatabaseField[];
  sortRules: SortRule[];
}

export function useOptimisticDatabasePages({
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
    mutationFn: ({ pageId, updates }: { pageId: string, updates: Partial<Page> }) => PageService.updatePage(pageId, updates),
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
      return PageService.createPage(databaseId, user.id, { title: pageData.title || 'Untitled', databaseId });
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
