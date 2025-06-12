
import { supabase } from '@/integrations/supabase/client';
import { Database, DatabaseCreateRequest } from '@/types/database';

export class DatabaseCoreService {
  static async fetchDatabases(workspaceId: string) {
    const { data, error } = await supabase
      .from('databases')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    return { data, error: error?.message };
  }

  static async createDatabase(workspaceId: string, userId: string, request: DatabaseCreateRequest) {
    try {
      // Use the RPC function to create database with fields
      const { data, error } = await supabase.rpc('create_database_with_fields', {
        p_workspace_id: workspaceId,
        p_user_id: userId,
        p_name: request.name,
        p_description: request.description || null,
        p_fields: request.fields || []
      });

      if (error) {
        console.error('Database creation error:', error);
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'No data returned from database creation' };
      }

      // Return the first result from the RPC function
      const result = data[0];
      return { 
        data: {
          id: result.database_id,
          name: result.database_name,
          table_name: result.table_name,
          workspace_id: workspaceId,
          description: request.description,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, 
        error: null 
      };
    } catch (err) {
      console.error('Database creation error:', err);
      return { data: null, error: 'Failed to create database' };
    }
  }

  static async deleteDatabase(databaseId: string) {
    const { error } = await supabase
      .from('databases')
      .delete()
      .eq('id', databaseId);

    return { error: error?.message };
  }
}
