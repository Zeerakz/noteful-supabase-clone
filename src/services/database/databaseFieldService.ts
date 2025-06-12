
import { supabase } from '@/integrations/supabase/client';
import { DatabaseField } from '@/types/database';

export class DatabaseFieldService {
  static async fetchDatabaseFields(databaseId: string): Promise<{ data: DatabaseField[] | null; error: string | null }> {
    try {
      console.log('Fetching fields for database:', databaseId);
      
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('database_id', databaseId)
        .order('pos', { ascending: true });

      if (error) {
        console.error('Supabase error fetching fields:', error);
        throw error;
      }

      console.log('Fields fetched successfully:', data);
      return { data: (data || []) as DatabaseField[], error: null };
    } catch (err) {
      console.error('Error in fetchDatabaseFields:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch database fields' 
      };
    }
  }
}
