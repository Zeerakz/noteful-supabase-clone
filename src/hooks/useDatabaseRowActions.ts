
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PageService } from '@/services/pageService';
import { useOptimisticPropertyUpdate } from '@/hooks/useOptimisticPropertyUpdate';
import { Page } from '@/types/page';

interface UseDatabaseRowActionsProps {
  databaseId: string;
  workspaceId: string;
  refetchPages: () => Promise<any>;
  optimisticUpdatePage: (pageId: string, updates: Partial<Page>) => void;
  optimisticDeletePage: (pageId: string) => void;
  optimisticUpdateProperty: (pageId: string, fieldId: string, value: string) => void;
}

export function useDatabaseRowActions({
  databaseId,
  workspaceId,
  refetchPages,
  optimisticUpdatePage,
  optimisticDeletePage,
  optimisticUpdateProperty,
}: UseDatabaseRowActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const propertyUpdateMutation = useOptimisticPropertyUpdate(databaseId);

  const handleCreateRow = useCallback(async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a row",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('useDatabaseRowActions: Creating new row', { databaseId, workspaceId, userId: user.id });
      
      const { data, error } = await PageService.createPage(
        workspaceId,
        user.id,
        { title: 'Untitled', databaseId }
      );
      
      if (error) {
        console.error('Error creating page:', error);
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        console.log('Page created successfully:', data);
        toast({
          title: "Success",
          description: "New row created",
        });
        await refetchPages();
      }
    } catch (err) {
      console.error('Exception creating page:', err);
      toast({
        title: "Error",
        description: "Failed to create row",
        variant: "destructive",
      });
    }
  }, [user, workspaceId, databaseId, toast, refetchPages]);

  const handleDeleteRow = useCallback(async (pageId: string) => {
    try {
      console.log('useDatabaseRowActions: Deleting row', { pageId });
      optimisticDeletePage(pageId);
      
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
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete row",
        variant: "destructive",
      });
    }
  }, [toast, optimisticDeletePage]);

  const handleTitleUpdate = useCallback(async (pageId: string, newTitle: string) => {
    if (!user) return;
    optimisticUpdatePage(pageId, { title: newTitle });
    const { error } = await PageService.updatePage(pageId, { title: newTitle });
    if (error) {
      toast({ title: "Error", description: `Failed to update title: ${error}`, variant: "destructive" });
    }
  }, [user, optimisticUpdatePage, toast]);

  const handlePropertyUpdate = useCallback(async (pageId: string, fieldId: string, value: string) => {
    if (!user) return;
    optimisticUpdateProperty(pageId, fieldId, value);
    try {
      await propertyUpdateMutation.mutateAsync({ pageId, fieldId, value });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update property", variant: "destructive" });
    }
  }, [user, optimisticUpdateProperty, propertyUpdateMutation, toast]);

  return {
    handleCreateRow,
    handleDeleteRow,
    handleTitleUpdate,
    handlePropertyUpdate,
  };
}
