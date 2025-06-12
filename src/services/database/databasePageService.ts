
import { supabase } from '@/integrations/supabase/client';

export class DatabasePageService {
  static async createDatabasePage(databaseId: string, workspaceId: string, userId: string, title: string) {
    const { data, error } = await supabase
      .from('pages')
      .insert({
        workspace_id: workspaceId,
        database_id: databaseId,
        title: title,
        created_by: userId
      })
      .select()
      .single();

    return { data, error: error?.message };
  }
}
