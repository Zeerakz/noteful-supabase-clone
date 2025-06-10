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
      
      // First, let's try to create the databases table if it doesn't exist
      await DatabaseService.ensureDatabasesTableExists();
      
      // Create database record - using type assertion since 'databases' table exists but isn't in generated types
      const { data: database, error: dbError } = await (supabase as any)
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

  static async ensureDatabasesTableExists(): Promise<void> {
    // This method will be used to check if the databases table exists
    // If not, we'll need to create it via SQL migration
    try {
      await (supabase as any).from('databases').select('count').limit(1);
    } catch (error) {
      // If table doesn't exist, we'll log it but continue
      console.log('Databases table may need to be created');
    }
  }

  static async fetchDatabases(workspaceId: string): Promise<{ data: Database[] | null; error: string | null }> {
    try {
      // Using type assertion since 'databases' table exists but isn't in generated types
      const { data, error } = await (supabase as any)
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
      // Using type assertion since 'databases' table exists but isn't in generated types
      const { error } = await (supabase as any)
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
