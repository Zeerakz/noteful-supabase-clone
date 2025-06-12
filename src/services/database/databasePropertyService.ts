
import { supabase } from '@/integrations/supabase/client';

export class DatabasePropertyService {
  static async createPageProperty(
    pageId: string,
    fieldId: string,
    value: string,
    userId: string
  ): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('page_properties')
        .insert([
          {
            page_id: pageId,
            field_id: fieldId,
            value: value,
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
        error: err instanceof Error ? err.message : 'Failed to create page property' 
      };
    }
  }
}
