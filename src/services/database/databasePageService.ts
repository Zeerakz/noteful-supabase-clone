
import { supabase } from '@/integrations/supabase/client';

export class DatabasePageService {
  static async createDatabasePage(databaseId: string, workspaceId: string, userId: string, title: string) {
    const properties = { title, database_id: databaseId };
    const pageData = {
      properties,
      type: 'page' as const,
      workspace_id: workspaceId,
      created_by: userId,
      last_edited_by: userId,
      pos: 0,
    };
    const { data, error } = await supabase.from('blocks').insert(pageData).select().single();
    return { data, error: error ? error.message : null };
  }
}
