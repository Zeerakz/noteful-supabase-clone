
import { supabase } from '@/integrations/supabase/client';
import { SavedDatabaseView, SavedViewPermission } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';

export class SavedDatabaseViewService {
  static async getUserViews(
    databaseId: string,
    userId: string
  ): Promise<{ data: SavedDatabaseView[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('saved_database_views')
        .select('*')
        .eq('database_id', databaseId)
        .or(`user_id.eq.${userId},is_shared.eq.true`)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data: data as SavedDatabaseView[], error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch views' 
      };
    }
  }

  static async createView(
    databaseId: string,
    workspaceId: string,
    userId: string,
    name: string,
    viewType: string,
    filters: FilterGroup,
    sorts: SortRule[] = [],
    groupingPropertyId?: string,
    description?: string,
    visiblePropertyIds?: string[]
  ): Promise<{ data: SavedDatabaseView | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('saved_database_views')
        .insert({
          database_id: databaseId,
          workspace_id: workspaceId,
          user_id: userId,
          name,
          description,
          view_type: viewType,
          filters: JSON.stringify(filters),
          sorts: JSON.stringify(sorts),
          grouping_property_id: groupingPropertyId,
          grouping_collapsed_groups: [],
          visible_property_ids: visiblePropertyIds || [],
          is_shared: false,
          is_default: false,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as SavedDatabaseView, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to create view' 
      };
    }
  }

  static async updateView(
    viewId: string,
    updates: Partial<SavedDatabaseView>
  ): Promise<{ data: SavedDatabaseView | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('saved_database_views')
        .update(updates)
        .eq('id', viewId)
        .select()
        .single();

      if (error) throw error;
      return { data: data as SavedDatabaseView, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to update view' 
      };
    }
  }

  static async deleteView(
    viewId: string
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('saved_database_views')
        .delete()
        .eq('id', viewId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to delete view' 
      };
    }
  }

  static async duplicateView(
    viewId: string,
    newName: string
  ): Promise<{ data: SavedDatabaseView | null; error: string | null }> {
    try {
      // First get the original view
      const { data: originalView, error: fetchError } = await supabase
        .from('saved_database_views')
        .select('*')
        .eq('id', viewId)
        .single();

      if (fetchError) throw fetchError;

      // Create a new view with the same settings but different name
      const { data, error } = await supabase
        .from('saved_database_views')
        .insert({
          database_id: originalView.database_id,
          workspace_id: originalView.workspace_id,
          user_id: originalView.user_id,
          name: newName,
          description: originalView.description,
          view_type: originalView.view_type,
          filters: originalView.filters,
          sorts: originalView.sorts,
          grouping_property_id: originalView.grouping_property_id,
          grouping_collapsed_groups: originalView.grouping_collapsed_groups,
          visible_property_ids: originalView.visible_property_ids,
          is_shared: false,
          is_default: false,
          created_by: originalView.user_id,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as SavedDatabaseView, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to duplicate view' 
      };
    }
  }

  static async shareView(
    viewId: string,
    userId: string,
    permissionType: 'view' | 'edit' = 'view'
  ): Promise<{ data: SavedViewPermission | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('saved_view_permissions')
        .insert({
          view_id: viewId,
          user_id: userId,
          permission_type: permissionType,
          granted_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as SavedViewPermission, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to share view' 
      };
    }
  }

  static async unshareView(
    viewId: string,
    userId: string
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('saved_view_permissions')
        .delete()
        .eq('view_id', viewId)
        .eq('user_id', userId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to unshare view' 
      };
    }
  }

  static async setDefaultView(
    databaseId: string,
    viewId: string,
    userId: string
  ): Promise<{ error: string | null }> {
    try {
      // First, unset all other default views for this user/database
      await supabase
        .from('saved_database_views')
        .update({ is_default: false })
        .eq('database_id', databaseId)
        .eq('user_id', userId);

      // Then set the new default view
      const { error } = await supabase
        .from('saved_database_views')
        .update({ is_default: true })
        .eq('id', viewId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to set default view' 
      };
    }
  }
}
