
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type DatabaseViewType = 'table' | 'list' | 'calendar' | 'kanban' | 'form' | 'gallery';

export function useDatabaseView(databaseId: string) {
  const [defaultView, setDefaultView] = useState<DatabaseViewType>('table');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDefaultView = async () => {
      if (!user || !databaseId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('database_views')
          .select('default_view_type')
          .eq('database_id', databaseId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching default view:', error.message);
          // Use default 'table' view if there's an error
        } else if (data?.default_view_type) {
          setDefaultView(data.default_view_type as DatabaseViewType);
        }
      } catch (err) {
        console.warn('Error fetching default view:', err);
        // Use default 'table' view if there's an error
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

      const { error } = await supabase
        .from('database_views')
        .upsert(
          {
            database_id: databaseId,
            user_id: user.id,
            default_view_type: viewType,
          },
          {
            onConflict: 'database_id,user_id'
          }
        );

      if (error) {
        console.warn('Error saving default view:', error.message);
        // Don't throw error to avoid breaking the UI
      }
    } catch (err) {
      console.warn('Error saving default view:', err);
      // Don't throw error to avoid breaking the UI
    }
  };

  return {
    defaultView,
    saveDefaultView,
    loading,
  };
}
