
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFilteredDatabasePages } from '@/hooks/useFilteredDatabasePages';
import { useOptimisticPropertyUpdate } from '@/hooks/useOptimisticPropertyUpdate';
import { PageService } from '@/services/pageService';
import { DatabaseField } from '@/types/database';
import { FilterRule } from '@/components/database/FilterModal';
import { SortRule } from '@/components/database/SortingModal';

interface PageWithProperties {
  id: string;
  title: string;
  workspace_id: string;
  database_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  parent_page_id: string | null;
  order_index: number;
  properties: Record<string, string>;
}

interface UseDatabaseTableViewProps {
  databaseId: string;
  workspaceId: string;
  filters: FilterRule[];
  fields: DatabaseField[];
  sortRules: SortRule[];
}

export function useDatabaseTableView({
  databaseId,
  workspaceId,
  filters,
  fields,
  sortRules
}: UseDatabaseTableViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { 
    pages, 
    loading: pagesLoading, 
    error: pagesError,
    refetch: refetchPages
  } = useFilteredDatabasePages({
    databaseId,
    filters,
    fields,
    sortRules
  });

  const propertyUpdateMutation = useOptimisticPropertyUpdate(databaseId);

  // Transform pages data with properties
  const pagesWithProperties: PageWithProperties[] = pages.map(page => {
    const properties: Record<string, string> = {};
    
    const pageProperties = (page as any).page_properties || [];
    pageProperties.forEach((prop: any) => {
      properties[prop.field_id] = prop.value || '';
    });

    return {
      id: page.id,
      title: page.title,
      workspace_id: page.workspace_id,
      database_id: page.database_id,
      created_by: page.created_by,
      created_at: page.created_at,
      updated_at: page.updated_at,
      parent_page_id: page.parent_page_id,
      order_index: page.order_index,
      properties,
    };
  });

  const handleCreateRow = async () => {
    if (!user) return;

    try {
      const { data, error } = await PageService.createPage(
        workspaceId,
        user.id,
        { title: 'Untitled', databaseId }
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
          description: "New row created",
        });
        refetchPages();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create row",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRow = async (pageId: string) => {
    try {
      const { error } = await PageService.deletePage(pageId);
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Row deleted",
        });
        refetchPages();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete row",
        variant: "destructive",
      });
    }
  };

  const handleTitleUpdate = async (pageId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    try {
      const { error } = await PageService.updatePage(pageId, { title: newTitle.trim() });
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        refetchPages();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update title",
        variant: "destructive",
      });
    }
  };

  const handlePropertyUpdate = (pageId: string, fieldId: string, value: string) => {
    propertyUpdateMutation.mutate({
      pageId,
      fieldId,
      value
    });
  };

  return {
    pagesWithProperties,
    pagesLoading,
    pagesError,
    refetchPages,
    handleCreateRow,
    handleDeleteRow,
    handleTitleUpdate,
    handlePropertyUpdate,
  };
}
