
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyInheritanceService } from '@/services/propertyInheritanceService';
import { PageProperty, DatabaseField } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function usePropertyInheritance() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const applyInheritance = async (pageId: string, databaseId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return { success: false };
    }

    setLoading(true);
    try {
      const result = await PropertyInheritanceService.applyDatabaseInheritance(
        pageId,
        databaseId,
        user.id
      );

      if (result.success) {
        toast({
          title: "Success",
          description: `Applied ${result.appliedProperties?.length || 0} default properties from database`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to apply property inheritance",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply inheritance';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const removeInheritance = async (pageId: string, databaseId: string) => {
    setLoading(true);
    try {
      const result = await PropertyInheritanceService.removeDatabaseInheritance(
        pageId,
        databaseId
      );

      if (result.success) {
        toast({
          title: "Success",
          description: "Removed database properties from page",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to remove database properties",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove inheritance';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const syncDatabaseChanges = async (
    databaseId: string,
    addedFields: DatabaseField[],
    removedFieldIds: string[]
  ) => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return { success: false };
    }

    setLoading(true);
    try {
      const result = await PropertyInheritanceService.syncDatabasePropertyChanges(
        databaseId,
        addedFields,
        removedFieldIds,
        user.id
      );

      if (result.success) {
        const addedCount = addedFields.length;
        const removedCount = removedFieldIds.length;
        
        toast({
          title: "Success",
          description: `Synced database changes: +${addedCount} fields, -${removedCount} fields`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to sync database changes",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync changes';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    applyInheritance,
    removeInheritance,
    syncDatabaseChanges,
  };
}
