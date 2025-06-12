
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
      
      // Parse the grouping_collapsed_groups JSON if it exists
      if (data && data.grouping_collapsed_groups) {
        data.grouping_collapsed_groups = typeof data.grouping_collapsed_groups === 'string' 
          ? JSON.parse(data.grouping_collapsed_groups) 
          : data.grouping_collapsed_groups;
      }
      
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

  static async updateGrouping(
    databaseId: string,
    userId: string,
    groupingFieldId?: string,
    collapsedGroups?: string[]
  ): Promise<{ data: DatabaseView | null; error: string | null }> {
    try {
      // First get the current view to preserve the default_view_type
      const currentView = await this.getDefaultView(databaseId, userId);
      const defaultViewType = currentView.data?.default_view_type || 'table';

      const { data, error } = await supabase
        .from('database_views')
        .upsert(
          {
            database_id: databaseId,
            user_id: userId,
            default_view_type: defaultViewType,
            grouping_field_id: groupingFieldId,
            grouping_collapsed_groups: collapsedGroups || [],
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
        error: err instanceof Error ? err.message : 'Failed to update grouping' 
      };
    }
  }

  static async toggleGroupCollapse(
    databaseId: string,
    userId: string,
    groupValue: string
  ): Promise<{ data: DatabaseView | null; error: string | null }> {
    try {
      // First get the current view
      const currentView = await this.getDefaultView(databaseId, userId);
      if (currentView.error || !currentView.data) {
        return currentView;
      }

      const collapsedGroups = currentView.data.grouping_collapsed_groups || [];
      const isCollapsed = collapsedGroups.includes(groupValue);
      
      const updatedCollapsedGroups = isCollapsed
        ? collapsedGroups.filter(g => g !== groupValue)
        : [...collapsedGroups, groupValue];

      return this.updateGrouping(
        databaseId,
        userId,
        currentView.data.grouping_field_id,
        updatedCollapsedGroups
      );
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to toggle group collapse' 
      };
    }
  }
}
