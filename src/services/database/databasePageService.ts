
import { supabase } from '@/integrations/supabase/client';

export class DatabasePageService {
  static async createDatabasePage(
    databaseId: string,
    workspaceId: string,
    userId: string,
    title: string
  ): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('pages')
        .insert([
          {
            database_id: databaseId,
            workspace_id: workspaceId,
            title: title,
            created_by: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to create database page' 
      };
    }
  }
}
