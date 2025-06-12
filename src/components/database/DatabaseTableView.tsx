
import React from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useFilteredDatabasePages } from '@/hooks/useFilteredDatabasePages';
import { useOptimisticPropertyUpdate } from '@/hooks/useOptimisticPropertyUpdate';
import { DatabaseField } from '@/types/database';
import { FilterRule } from '@/components/database/FilterModal';
import { SortRule } from '@/components/database/SortingModal';
import { PageService } from '@/services/pageService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DatabaseTableHeader } from './table/DatabaseTableHeader';
import { VirtualizedTable } from './table/VirtualizedTable';
import { NoFieldsEmptyState } from './table/DatabaseTableEmptyStates';

interface DatabaseTableViewProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filters: FilterRule[];
  sortRules: SortRule[];
}

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

export function DatabaseTableView({ 
  databaseId, 
  workspaceId, 
  fields, 
  filters, 
  sortRules 
}: DatabaseTableViewProps) {
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

  if (pagesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="border rounded-lg p-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (pagesError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{pagesError}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetchPages}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DatabaseTableHeader onCreateRow={handleCreateRow} />

      <VirtualizedTable
        pages={pagesWithProperties}
        fields={fields}
        onTitleUpdate={handleTitleUpdate}
        onPropertyUpdate={handlePropertyUpdate}
        onDeleteRow={handleDeleteRow}
        isLoading={pagesLoading}
        maxHeight="600px"
      />

      {fields.length === 0 && <NoFieldsEmptyState />}
    </div>
  );
}
