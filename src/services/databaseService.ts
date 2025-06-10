
import { supabase } from '@/integrations/supabase/client';
import { Database, DatabaseCreateRequest, DatabaseField } from '@/types/database';

export class DatabaseService {
  static async createDatabase(
    workspaceId: string,
    userId: string,
    request: DatabaseCreateRequest
  ): Promise<{ data: Database | null; error: string | null }> {
    try {
      const tableName = `db_${request.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
      
      // Create database record - now using proper types
      const { data: database, error: dbError } = await supabase
        .from('databases')
        .insert([
          {
            workspace_id: workspaceId,
            name: request.name,
            table_name: tableName,
            description: request.description,
            created_by: userId,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      // Create field records
      const fieldsToCreate = request.fields.map((field, index) => ({
        database_id: database.id,
        name: field.name,
        type: field.type,
        settings: field.settings || {},
        pos: index,
        created_by: userId,
      }));

      const { error: fieldsError } = await supabase
        .from('fields')
        .insert(fieldsToCreate);

      if (fieldsError) throw fieldsError;

      return { data: database as Database, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to create database' 
      };
    }
  }

  static async fetchDatabases(workspaceId: string): Promise<{ data: Database[] | null; error: string | null }> {
    try {
      // Now using proper types without type assertion
      const { data, error } = await supabase
        .from('databases')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: (data || []) as Database[], error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch databases' 
      };
    }
  }

  static async fetchDatabaseFields(databaseId: string): Promise<{ data: DatabaseField[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('database_id', databaseId)
        .order('pos', { ascending: true });

      if (error) throw error;
      return { data: (data || []) as DatabaseField[], error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch database fields' 
      };
    }
  }

  static async deleteDatabase(databaseId: string): Promise<{ error: string | null }> {
    try {
      // Now using proper types without type assertion
      const { error } = await supabase
        .from('databases')
        .delete()
        .eq('id', databaseId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to delete database' 
      };
    }
  }
}
