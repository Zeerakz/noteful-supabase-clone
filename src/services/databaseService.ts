
import { supabase } from '@/integrations/supabase/client';
import { Database, DatabaseCreateRequest } from '@/types/database';

export class DatabaseService {
  static async fetchDatabases(workspaceId: string) {
    const { data, error } = await supabase
      .from('databases')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    return { data, error: error?.message };
  }

  static async createDatabase(workspaceId: string, userId: string, request: DatabaseCreateRequest) {
    const { data, error } = await supabase.rpc('create_database_with_fields', {
      p_workspace_id: workspaceId,
      p_user_id: userId,
      p_name: request.name,
      p_description: request.description,
      p_fields: request.fields
    });

    return { data, error: error?.message };
  }

  static async updateDatabase(databaseId: string, updates: Partial<Pick<Database, 'name' | 'description' | 'icon'>>) {
    const { data, error } = await supabase
      .from('databases')
      .update(updates)
      .eq('id', databaseId)
      .select()
      .single();

    return { data, error: error?.message };
  }

  static async deleteDatabase(databaseId: string) {
    const { error } = await supabase
      .from('databases')
      .delete()
      .eq('id', databaseId);

    return { error: error?.message };
  }
}
