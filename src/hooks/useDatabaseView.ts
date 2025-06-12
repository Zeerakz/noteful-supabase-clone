
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseViewService } from '@/services/databaseViewService';

export type DatabaseViewType = 'table' | 'list' | 'calendar' | 'kanban' | 'form';

export function useDatabaseView(databaseId: string) {
  const [defaultView, setDefaultView] = useState<DatabaseViewType>('table');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load the user's preferred default view
  useEffect(() => {
    const loadDefaultView = async () => {
      if (!user || !databaseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await DatabaseViewService.getDefaultView(
          databaseId,
          user.id
        );

        if (error) {
          console.error('Error loading default view:', error);
          setError(error);
        } else if (data) {
          setDefaultView(data.default_view_type);
        }
        // If no preference exists, keep the default 'table' view
      } catch (err) {
        console.error('Error loading default view:', err);
        setError(err instanceof Error ? err.message : 'Failed to load default view');
      } finally {
        setLoading(false);
      }
    };

    loadDefaultView();
  }, [databaseId, user]);

  // Save the user's preferred default view
  const saveDefaultView = async (viewType: DatabaseViewType) => {
    if (!user || !databaseId) return;

    try {
      const { error } = await DatabaseViewService.setDefaultView(
        databaseId,
        user.id,
        viewType
      );

      if (error) {
        console.error('Error saving default view:', error);
        setError(error);
      } else {
        setDefaultView(viewType);
        setError(null);
      }
    } catch (err) {
      console.error('Error saving default view:', err);
      setError(err instanceof Error ? err.message : 'Failed to save default view');
    }
  };

  return {
    defaultView,
    saveDefaultView,
    loading,
    error,
  };
}
