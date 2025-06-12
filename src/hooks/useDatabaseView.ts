
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseViewService } from '@/services/databaseViewService';

export type DatabaseViewType = 'table' | 'list' | 'timeline' | 'calendar' | 'kanban' | 'form' | 'gallery';

export function useDatabaseView(databaseId: string) {
  const [defaultView, setDefaultView] = useState<DatabaseViewType>('table');
  const [groupingFieldId, setGroupingFieldId] = useState<string | undefined>();
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDefaultView = async () => {
      if (!user || !databaseId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await DatabaseViewService.getDefaultView(databaseId, user.id);

        if (error) {
          console.warn('Error fetching default view:', error);
          // Use default values if there's an error
        } else if (data) {
          setDefaultView(data.default_view_type as DatabaseViewType);
          setGroupingFieldId(data.grouping_field_id);
          setCollapsedGroups(data.grouping_collapsed_groups || []);
        }
      } catch (err) {
        console.warn('Error fetching default view:', err);
        // Use default values if there's an error
      } finally {
        setLoading(false);
      }
    };

    fetchDefaultView();
  }, [databaseId, user?.id]);

  const saveDefaultView = async (viewType: DatabaseViewType) => {
    if (!user || !databaseId) return;

    try {
      setDefaultView(viewType);

      const { error } = await DatabaseViewService.setDefaultView(databaseId, user.id, viewType);

      if (error) {
        console.warn('Error saving default view:', error);
        // Don't throw error to avoid breaking the UI
      }
    } catch (err) {
      console.warn('Error saving default view:', err);
      // Don't throw error to avoid breaking the UI
    }
  };

  const updateGrouping = async (fieldId?: string) => {
    if (!user || !databaseId) return;

    try {
      setGroupingFieldId(fieldId);
      setCollapsedGroups([]); // Reset collapsed groups when changing grouping field

      const { error } = await DatabaseViewService.updateGrouping(
        databaseId,
        user.id,
        fieldId,
        []
      );

      if (error) {
        console.warn('Error updating grouping:', error);
      }
    } catch (err) {
      console.warn('Error updating grouping:', err);
    }
  };

  const toggleGroupCollapse = async (groupValue: string) => {
    if (!user || !databaseId) return;

    try {
      const { data, error } = await DatabaseViewService.toggleGroupCollapse(
        databaseId,
        user.id,
        groupValue
      );

      if (error) {
        console.warn('Error toggling group collapse:', error);
      } else if (data) {
        setCollapsedGroups(data.grouping_collapsed_groups || []);
      }
    } catch (err) {
      console.warn('Error toggling group collapse:', err);
    }
  };

  return {
    defaultView,
    groupingFieldId,
    collapsedGroups,
    saveDefaultView,
    updateGrouping,
    toggleGroupCollapse,
    loading,
  };
}
