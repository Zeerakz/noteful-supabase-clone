
import { supabase } from '@/integrations/supabase/client';
import { DatabaseView } from '@/types/database';

export class DatabaseViewService {
  static async getDefaultView(
    databaseId: string,
    userId: string
  ): Promise<{ data: DatabaseView | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('database_views')
        .select('*')
        .eq('database_id', databaseId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return { data: data as DatabaseView | null, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch default view' 
      };
    }
  }

  static async setDefaultView(
    databaseId: string,
    userId: string,
    viewType: 'table' | 'list' | 'timeline' | 'calendar' | 'kanban' | 'form' | 'gallery'
  ): Promise<{ data: DatabaseView | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('database_views')
        .upsert(
          {
            database_id: databaseId,
            user_id: userId,
            default_view_type: viewType,
          },
          {
            onConflict: 'database_id,user_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return { data: data as DatabaseView, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to set default view' 
      };
    }
  }
}
