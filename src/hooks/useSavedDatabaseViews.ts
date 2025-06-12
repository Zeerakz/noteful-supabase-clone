
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SavedDatabaseView } from '@/types/database';
import { SavedDatabaseViewService } from '@/services/savedDatabaseViewService';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { createEmptyFilterGroup } from '@/utils/filterUtils';

export function useSavedDatabaseViews(databaseId: string, workspaceId: string) {
  const { user } = useAuth();
  const [views, setViews] = useState<SavedDatabaseView[]>([]);
  const [currentView, setCurrentView] = useState<SavedDatabaseView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a default view when saved views can't be loaded
  const createDefaultView = useCallback((): SavedDatabaseView => {
    return {
      id: 'default-view',
      database_id: databaseId,
      workspace_id: workspaceId,
      user_id: user?.id || '',
      name: 'All Campaigns',
      description: null,
      view_type: 'table',
      filters: JSON.stringify(createEmptyFilterGroup()),
      sorts: JSON.stringify([]),
      grouping_field_id: null,
      grouping_collapsed_groups: [],
      is_shared: false,
      is_default: true,
      created_by: user?.id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }, [databaseId, workspaceId, user?.id]);

  const fetchViews = useCallback(async () => {
    if (!user || !databaseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await SavedDatabaseViewService.getUserViews(databaseId, user.id);
      
      if (fetchError) {
        console.warn('Failed to fetch saved views, using default view:', fetchError);
        // Use default view when saved views can't be loaded
        const defaultView = createDefaultView();
        setViews([defaultView]);
        setCurrentView(defaultView);
      } else {
        const viewsData = data || [];
        
        if (viewsData.length === 0) {
          // No saved views exist, create a default view
          const defaultView = createDefaultView();
          setViews([defaultView]);
          setCurrentView(defaultView);
        } else {
          setViews(viewsData);
          // Set the default view or the first view as current
          const defaultView = viewsData.find(v => v.is_default) || viewsData[0];
          setCurrentView(defaultView);
        }
      }
    } catch (err) {
      console.error('Error fetching views:', err);
      // Fallback to default view
      const defaultView = createDefaultView();
      setViews([defaultView]);
      setCurrentView(defaultView);
      setError('Using default view due to system error');
    } finally {
      setLoading(false);
    }
  }, [user, databaseId, createDefaultView]);

  const createView = async (
    name: string,
    viewType: string,
    filters: FilterGroup,
    sorts: SortRule[] = [],
    groupingFieldId?: string,
    description?: string
  ) => {
    if (!user) return { error: 'User not authenticated' };

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
        return { error };
      }

      if (data) {
        setViews(prev => [...prev, data]);
        return { data };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to create view' };
    }

    return { error: 'Unknown error occurred' };
  };

  const updateView = async (viewId: string, updates: Partial<SavedDatabaseView>) => {
    try {
      const { data, error } = await SavedDatabaseViewService.updateView(viewId, updates);

      if (error) {
        return { error };
      }

      if (data) {
        setViews(prev => prev.map(v => v.id === viewId ? data : v));
        if (currentView?.id === viewId) {
          setCurrentView(data);
        }
        return { data };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update view' };
    }

    return { error: 'Unknown error occurred' };
  };

  const deleteView = async (viewId: string) => {
    try {
      const { error } = await SavedDatabaseViewService.deleteView(viewId);

      if (error) {
        return { error };
      }

      setViews(prev => prev.filter(v => v.id !== viewId));
      
      // If we deleted the current view, switch to the first remaining view
      if (currentView?.id === viewId) {
        const remainingViews = views.filter(v => v.id !== viewId);
        setCurrentView(remainingViews.length > 0 ? remainingViews[0] : null);
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete view' };
    }
  };

  const duplicateView = async (viewId: string, newName: string) => {
    try {
      const { data, error } = await SavedDatabaseViewService.duplicateView(viewId, newName);

      if (error) {
        return { error };
      }

      if (data) {
        setViews(prev => [...prev, data]);
        return { data };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to duplicate view' };
    }

    return { error: 'Unknown error occurred' };
  };

  const setDefaultView = async (viewId: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await SavedDatabaseViewService.setDefaultView(databaseId, viewId, user.id);

      if (error) {
        return { error };
      }

      // Update the views to reflect the new default
      setViews(prev => prev.map(v => ({
        ...v,
        is_default: v.id === viewId
      })));

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to set default view' };
    }
  };

  useEffect(() => {
    fetchViews();
  }, [fetchViews]);

  return {
    views,
    currentView,
    setCurrentView,
    loading,
    error,
    createView,
    updateView,
    deleteView,
    duplicateView,
    setDefaultView,
    refetch: fetchViews,
  };
}
