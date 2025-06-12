
import { supabase } from '@/integrations/supabase/client';
import { DatabaseField } from '@/types/database';

export class DatabaseFieldService {
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
}
