import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SavedDatabaseViewService } from '@/services/savedDatabaseViewService';
import { SavedDatabaseView } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { useToast } from '@/hooks/use-toast';

export function useSavedDatabaseViews(databaseId: string, workspaceId: string) {
  const [views, setViews] = useState<SavedDatabaseView[]>([]);
  const [currentView, setCurrentView] = useState<SavedDatabaseView | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchViews = async () => {
      if (!user || !databaseId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await SavedDatabaseViewService.getUserViews(databaseId, user.id);

        if (error) {
          console.warn('Error fetching views:', error);
          setViews([]);
        } else if (data) {
          setViews(data);
          // Set current view to default or first view
          const defaultView = data.find(v => v.is_default && v.user_id === user.id);
          setCurrentView(defaultView || data[0] || null);
        }
      } catch (err) {
        console.warn('Error fetching views:', err);
        setViews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchViews();
  }, [databaseId, user?.id]);

  const createView = async (
    name: string,
    viewType: string,
    filters: FilterGroup,
    sorts: SortRule[] = [],
    groupingFieldId?: string,
    description?: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await SavedDatabaseViewService.createView(
        databaseId,
        workspaceId,
        user.id,
        name,
        viewType,
        filters,
        sorts,
        groupingFieldId,
        description
      );

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return null;
      }

      if (data) {
        setViews(prev => [...prev, data]);
        toast({
          title: "Success",
          description: `View "${name}" created successfully`,
        });
        return data;
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create view",
        variant: "destructive",
      });
    }
    return null;
  };

  const updateView = async (viewId: string, updates: Partial<SavedDatabaseView>) => {
    try {
      const { data, error } = await SavedDatabaseViewService.updateView(viewId, updates);

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setViews(prev => prev.map(v => v.id === viewId ? data : v));
        if (currentView?.id === viewId) {
          setCurrentView(data);
        }
        toast({
          title: "Success",
          description: "View updated successfully",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update view",
        variant: "destructive",
      });
    }
  };

  const deleteView = async (viewId: string) => {
    try {
      const { error } = await SavedDatabaseViewService.deleteView(viewId);

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      setViews(prev => prev.filter(v => v.id !== viewId));
      if (currentView?.id === viewId) {
        const remainingViews = views.filter(v => v.id !== viewId);
        setCurrentView(remainingViews[0] || null);
      }
      toast({
        title: "Success",
        description: "View deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete view",
        variant: "destructive",
      });
    }
  };

  const duplicateView = async (viewId: string, newName: string) => {
    try {
      const { data, error } = await SavedDatabaseViewService.duplicateView(viewId, newName);

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return null;
      }

      if (data) {
        setViews(prev => [...prev, data]);
        toast({
          title: "Success",
          description: `View "${newName}" created successfully`,
        });
        return data;
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to duplicate view",
        variant: "destructive",
      });
    }
    return null;
  };

  const setDefaultView = async (viewId: string) => {
    if (!user) return;

    try {
      const { error } = await SavedDatabaseViewService.setDefaultView(databaseId, viewId, user.id);

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      setViews(prev => prev.map(v => ({ 
        ...v, 
        is_default: v.id === viewId && v.user_id === user.id 
      })));
      toast({
        title: "Success",
        description: "Default view updated",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to set default view",
        variant: "destructive",
      });
    }
  };

  return {
    views,
    currentView,
    setCurrentView,
    loading,
    createView,
    updateView,
    deleteView,
    duplicateView,
    setDefaultView,
  };
}
