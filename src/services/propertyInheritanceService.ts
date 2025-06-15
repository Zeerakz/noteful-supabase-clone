
import { supabase } from '@/integrations/supabase/client';

export class PropertyInheritanceService {
  static async applyDatabaseInheritance(pageId: string, databaseId: string, userId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.rpc('apply_properties_to_page', {
        p_page_id: pageId,
        p_database_id: databaseId,
        p_user_id: userId,
      });

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to apply database properties' 
      };
    }
  }

  static async removeDatabaseInheritance(pageId: string, databaseId: string): Promise<{ error: string | null }> {
    try {
      const { data: fields, error: fieldsError } = await supabase
        .from('fields')
        .select('id')
        .eq('database_id', databaseId);

      if (fieldsError) throw fieldsError;

      if (!fields || fields.length === 0) {
        return { error: null }; // No fields to remove properties for
      }
      
      const fieldIds = fields.map(f => f.id);

      const { error } = await supabase
        .from('page_properties')
        .delete()
        .eq('page_id', pageId)
        .in('field_id', fieldIds);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to remove database properties' 
      };
    }
  }
}
