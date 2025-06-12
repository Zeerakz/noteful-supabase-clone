
import { supabase } from '@/integrations/supabase/client';

export class DatabasePropertyService {
  static async createPageProperty(pageId: string, fieldId: string, value: string, userId: string) {
    const { data, error } = await supabase
      .from('page_properties')
      .upsert({
        page_id: pageId,
        field_id: fieldId,
        value: value,
        created_by: userId
      })
      .select()
      .single();

    return { data, error: error?.message };
  }
}
